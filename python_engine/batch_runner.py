"""
Batch Runner for Doodle Lip-Sync Studio
Scans input_audio/ directory and renders all dialogue files in parallel or batch into output_videos/.
Usage:
  python_engine/venv/bin/python -m python_engine.batch_runner --style googly --format greenscreen
"""

import os
import sys
import argparse
import glob
from .video_exporter import VideoExporter


def run_batch(input_dir="input_audio", output_dir="output_videos",
              style="googly", export_format="greenscreen",
              fps=30, resolution=(1080, 1080), layers=None):
    preset_path = os.path.join("presets", f"{style}.json")
    if not os.path.exists(preset_path):
        print(f"Error: Preset not found at {preset_path}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)
    audio_extensions = ["*.wav", "*.mp3", "*.m4a", "*.ogg", "*.flac"]
    audio_files = []
    for ext in audio_extensions:
        audio_files.extend(glob.glob(os.path.join(input_dir, ext)))

    if not audio_files:
        print(f"No audio files found in '{input_dir}'. Please drop your voiceover files there!")
        return

    print(f"Found {len(audio_files)} audio file(s) in '{input_dir}'")
    print(f"Rendering with style='{style}', format='{export_format}', fps={fps}, resolution={resolution}...")

    exporter = VideoExporter(fps=fps, resolution=resolution)

    for i, audio_file in enumerate(audio_files):
        base_name = os.path.splitext(os.path.basename(audio_file))[0]
        ext = "mov" if export_format == "prores" else ("webm" if export_format == "webm" else "mp4")
        output_file = os.path.join(output_dir, f"{base_name}_{style}_{export_format}.{ext}")

        print(f"\n[{i+1}/{len(audio_files)}] Processing: {base_name}...")

        def on_progress(p):
            sys.stdout.write(f"\r  Progress: {p}%")
            sys.stdout.flush()

        result = exporter.export(
            audio_file=audio_file,
            preset_path=preset_path,
            output_path=output_file,
            export_format=export_format,
            layers=layers,
            on_progress=on_progress
        )
        print(f"\n  ✓ Done! Saved to: {result['output_file']} ({result['duration']}s, {result['total_frames']} frames)")

    print(f"\n🎉 Batch render complete! All {len(audio_files)} videos are ready in '{output_dir}'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Doodle Lip-Sync Studio - Batch Processor")
    parser.add_argument("--input", default="input_audio", help="Input directory containing audio files")
    parser.add_argument("--output", default="output_videos", help="Output directory for rendered videos")
    parser.add_argument("--style", default="googly", help="Face preset style (googly, kawaii, comic)")
    parser.add_argument("--format", default="greenscreen", choices=["greenscreen", "prores", "webm"], help="Export format")
    parser.add_argument("--fps", type=int, default=30, help="Target FPS (30 or 60)")
    parser.add_argument("--no-eyes", action="store_true", help="Render mouth only (disable eyes)")
    parser.add_argument("--no-brows", action="store_true", help="Disable eyebrows")

    args = parser.parse_args()

    layers = {
        "eyes": not args.no_eyes,
        "mouth": True,
        "eyebrows": not args.no_brows,
        "cheeks": True,
    }

    run_batch(
        input_dir=args.input,
        output_dir=args.output,
        style=args.style,
        export_format=args.format,
        fps=args.fps,
        layers=layers,
    )
