"""
Audio Engine for Doodle Lip-Sync Studio
Analyzes audio files to produce deterministic frame-by-frame lip-sync visemes,
RMS volume, frequency spectrum distribution, and speech detection.
"""

import os
import subprocess
import numpy as np

try:
    import soundfile as sf
except ImportError:
    sf = None


class AudioEngine:
    def __init__(self, fps=30):
        self.fps = fps
        self.noise_threshold = 0.035

    def load_audio(self, file_path):
        """
        Loads audio file into a 1D mono float32 numpy array normalized to [-1.0, 1.0].
        If soundfile fails or format is compressed (e.g. mp3, m4a), falls back to ffmpeg.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        try:
            if sf is not None:
                data, sample_rate = sf.read(file_path, dtype='float32')
                if data.ndim > 1:
                    data = np.mean(data, axis=1)  # Convert stereo to mono
                return data, sample_rate
        except Exception:
            pass

        # Fallback to ffmpeg for universal format compatibility
        cmd = [
            'ffmpeg', '-v', 'quiet', '-i', file_path,
            '-f', 'f32le', '-acodec', 'pcm_f32le',
            '-ac', '1', '-ar', '44100', '-'
        ]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        raw_bytes, _ = proc.communicate()
        data = np.frombuffer(raw_bytes, dtype=np.float32)
        return data, 44100

    def analyze(self, file_path, mood_markers=None, gaze_markers=None):
        """
        Performs frame-by-frame acoustic analysis throughout the audio.
        Returns a dictionary containing duration, fps, total_frames, and frame list.
        """
        data, sample_rate = self.load_audio(file_path)
        total_samples = len(data)
        duration = total_samples / sample_rate
        total_frames = int(np.ceil(duration * self.fps))

        frame_interval_samples = sample_rate / self.fps
        window_size = int(sample_rate * 0.05)  # 50ms window

        frames = []

        # Lip-sync smoothing state
        current_open_y = 0.0
        current_width_x = 1.0
        attack_alpha = 0.55
        decay_alpha = 0.32

        # Poisson blink simulation state
        blink_progress = 0.0
        is_blinking = False
        blink_start_time = 0.0
        blink_duration = 0.13
        next_blink_time = np.random.uniform(2.4, 4.2)
        double_blink_pending = False

        # Saccade state
        saccade_x = 0.0
        saccade_y = 0.0
        target_saccade_x = 0.0
        target_saccade_y = 0.0
        next_saccade_time = 1.5

        for f in range(total_frames):
            current_time = f / self.fps

            # 1. Window slicing
            center = int(f * frame_interval_samples)
            start = max(0, center - window_size // 2)
            end = min(total_samples, start + window_size)

            slice_data = data[start:end]
            if len(slice_data) == 0:
                slice_data = np.zeros(1, dtype=np.float32)

            # 2. RMS Amplitude & Zero-Crossing Rate
            rms = float(np.sqrt(np.mean(slice_data ** 2))) * 3.5
            rms = min(1.0, max(0.0, rms))

            zero_crossings = np.sum(np.diff(np.signbit(slice_data)))
            zcr = float(zero_crossings / len(slice_data)) if len(slice_data) > 0 else 0.0

            # 3. Viseme calculation
            is_silent = rms < self.noise_threshold
            if is_silent:
                target_viseme = 'REST'
                target_open_y = 0.0
                target_width_x = 1.0
                roundness = 0.0
            else:
                target_open_y = min(1.0, (rms - self.noise_threshold) / (0.8 - self.noise_threshold))
                if zcr > 0.14:
                    target_viseme = 'EE'
                    target_width_x = 1.25
                    target_open_y = min(target_open_y, 0.65)
                    roundness = 0.0
                elif zcr < 0.06 and rms > 0.3:
                    target_viseme = 'OO'
                    target_width_x = 0.72
                    target_open_y = target_open_y * 1.1
                    roundness = 0.8
                else:
                    target_viseme = 'AA'
                    target_width_x = 1.05
                    roundness = 0.2

            # Smooth mouth transitions
            alpha_y = attack_alpha if target_open_y > current_open_y else decay_alpha
            current_open_y += (target_open_y - current_open_y) * alpha_y
            current_width_x += (target_width_x - current_width_x) * decay_alpha

            # 4. Blink dynamics
            if not is_blinking and current_time >= next_blink_time:
                is_blinking = True
                blink_start_time = current_time
                if not double_blink_pending and np.random.rand() < 0.12:
                    double_blink_pending = True

            if is_blinking:
                elapsed = current_time - blink_start_time
                progress = elapsed / blink_duration
                if progress >= 1.0:
                    is_blinking = False
                    blink_progress = 0.0
                    if double_blink_pending:
                        next_blink_time = current_time + 0.12
                        double_blink_pending = False
                    else:
                        next_blink_time = current_time + np.random.uniform(2.5, 4.5)
                else:
                    blink_progress = float(np.sin(progress * np.pi))

            # 5. Saccade dynamics
            if current_time >= next_saccade_time:
                target_saccade_x = float(np.random.uniform(-4.0, 4.0))
                target_saccade_y = float(np.random.uniform(-2.5, 2.5))
                next_saccade_time = current_time + np.random.uniform(1.2, 2.8)

            saccade_x += (target_saccade_x - saccade_x) * 0.15
            saccade_y += (target_saccade_y - saccade_y) * 0.15

            # 6. Gaze markers lookup
            gaze_x, gaze_y = 0.0, 0.0
            if gaze_markers:
                for gm in gaze_markers:
                    if current_time >= gm.get('time', 0.0):
                        gaze_x = gm.get('gaze', {}).get('x', 0.0)
                        gaze_y = gm.get('gaze', {}).get('y', 0.0)

            frames.append({
                "frame": f,
                "time": round(current_time, 3),
                "rms": round(rms, 4),
                "viseme": target_viseme,
                "open_y": round(current_open_y, 4),
                "width_x": round(current_width_x, 4),
                "roundness": round(roundness, 3),
                "is_silent": bool(is_silent),
                "blink": round(blink_progress, 3),
                "pupil_x": round(saccade_x, 3),
                "pupil_y": round(saccade_y, 3),
                "gaze_x": round(gaze_x, 3),
                "gaze_y": round(gaze_y, 3),
            })

        return {
            "audio_file": file_path,
            "duration": round(duration, 3),
            "fps": self.fps,
            "total_frames": total_frames,
            "frames": frames,
        }
