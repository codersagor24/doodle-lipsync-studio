"""
Video Exporter for Doodle Lip-Sync Studio
Streams PyCairo RGBA frames directly into FFmpeg stdin.
Supports:
1. Apple ProRes 4444 with Alpha Channel (-c:v prores_ks)
2. WebM VP9 with Alpha Channel (-c:v libvpx-vp9)
3. Green Screen MP4 (-c:v libx264 with #00FF00 background)
"""

import os
import subprocess
from .audio_engine import AudioEngine
from .frame_renderer import FrameRenderer


class VideoExporter:
    def __init__(self, fps=30, resolution=(1080, 1080)):
        self.fps = fps
        self.width, self.height = resolution

    def export(self, audio_file, preset_path, output_path, export_format="greenscreen",
               layers=None, transform=None, bg_image_path=None, mood_markers=None, gaze_markers=None,
               on_progress=None):
        """
        Renders audio-driven video file.
        """
        if not os.path.exists(audio_file):
            raise FileNotFoundError(f"Audio file not found: {audio_file}")
        if not os.path.exists(preset_path):
            raise FileNotFoundError(f"Preset file not found: {preset_path}")

        # 1. Acoustic analysis
        engine = AudioEngine(fps=self.fps)
        analysis = engine.analyze(audio_file, mood_markers=mood_markers, gaze_markers=gaze_markers)
        total_frames = analysis["total_frames"]

        # 2. Setup Frame Renderer
        renderer = FrameRenderer.from_preset_file(preset_path, width=self.width, height=self.height)

        # 3. Setup FFmpeg command
        bg_mode = "greenscreen" if export_format == "greenscreen" else "transparent"
        if bg_image_path and os.path.exists(bg_image_path):
            bg_mode = "composite"

        cmd = [
            'ffmpeg', '-y',
            '-f', 'rawvideo',
            '-pix_fmt', 'bgra',  # Cairo FORMAT_ARGB32 in little-endian is BGRA bytes
            '-s', f'{self.width}x{self.height}',
            '-r', str(self.fps),
            '-i', '-',          # Read frames from stdin
            '-i', audio_file,    # Audio track
        ]

        if export_format == "prores":
            # ProRes 4444 with 10-bit Alpha channel (Pro post-production standard)
            cmd += [
                '-c:v', 'prores_ks',
                '-profile:v', '4',
                '-pix_fmt', 'yuva444p10le',
                '-c:a', 'pcm_s16le',
                '-shortest',
                output_path
            ]
        elif export_format == "webm":
            # WebM VP9 with Alpha channel
            cmd += [
                '-c:v', 'libvpx-vp9',
                '-pix_fmt', 'yuva420p',
                '-b:v', '8M',
                '-c:a', 'libopus',
                '-shortest',
                output_path
            ]
        else:
            # Green Screen MP4 H.264
            cmd += [
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-b:v', '10M',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-shortest',
                output_path
            ]

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

        try:
            for i, frame in enumerate(analysis["frames"]):
                raw_bytes = renderer.render_frame(
                    frame_data=frame,
                    layers=layers,
                    transform=transform,
                    bg_mode=bg_mode
                )
                proc.stdin.write(raw_bytes)

                if on_progress and (i % 10 == 0 or i == total_frames - 1):
                    progress = int(((i + 1) / total_frames) * 100)
                    on_progress(progress)

            proc.stdin.close()
            ret_code = proc.wait()
            if ret_code != 0:
                stderr = proc.stderr.read()
                raise RuntimeError(f"FFmpeg render error: {stderr.decode(errors='ignore')}")

        except Exception as e:
            proc.kill()
            raise e

        return {
            "status": "success",
            "output_file": output_path,
            "duration": analysis["duration"],
            "total_frames": total_frames,
            "fps": self.fps,
            "format": export_format,
        }
