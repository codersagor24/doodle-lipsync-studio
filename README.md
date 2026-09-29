# 🎬 Doodle Lip-Sync Studio

<div align="center">

![GitHub repo size](https://img.shields.io/github/repo-size/codersagor24/doodle-lipsync-studio?color=emerald)
![GitHub stars](https://img.shields.io/github/stars/codersagor24/doodle-lipsync-studio?style=social)
![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-6.1+-007808?logo=ffmpeg&logoColor=white)
![PyCairo](https://img.shields.io/badge/PyCairo-Vector-red)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

**High-volume cartoon face rigging & audio-driven lip-sync studio for inanimate objects (cucumbers on vines, talking trees, axes, body organs, and fruits).**

*Export Apple ProRes 4444 Alpha, WebM VP9 Alpha, and Chroma-Key Green Screen videos in seconds.*

[Features](#-key-features) • [Quick Start](#-quick-start) • [How to Use](#-step-by-step-user-guide) • [Video Editor Integration](#-video-editor-workflows) • [Python Batch Processing](#-high-volume-batch-processing) • [AI Agent Docs](#-ai-agents-collaboration)

</div>

---

## 📌 Why Doodle Lip-Sync Studio?

Creators producing high-volume educational and cartoon content face two major bottlenecks:
1. **Adobe After Effects Bottleneck:** Placing eye/mouth assets, generating audio amplitude keyframes, tracking objects, and tweaking visemes takes **30–45 minutes per scene**.
2. **Generative AI Video Models (SadTalker, LivePortrait):** These models are trained strictly on human face landmarks. When applied to cucumbers, trees, or cartoon drawings, they fail completely or distort and blur the entire background.
3. **The Solution:** A hybrid **Vector Canvas Rig + PyCairo/FFmpeg Engine**. Drop any audio dialogue, choose or customize a cartoon face, preview at 60 FPS, and export crystal-clear **ProRes 4444 Alpha MOV** or **Green Screen MP4** in **under 15–30 seconds**!

---

## ✨ Key Features

### 1. 🎨 5 Expressive Vector Art Styles (Built-in)
- 🥒 **Classic Googly:** Bold circular white eyes, dynamic black pupils, clean cartoon mouth (ideal for vegetables, trees, and tools).
- ✨ **Kawaii / Chibi Cute:** Glossy anime eyes with dual specular reflections, blushing cheeks, and sweet smile curves.
- 💥 **Retro Comic / Looney:** 1940s rubber-hose inspired furrowed eyebrows, visible gritted teeth, and screaming expressions.
- ✏️ **Minimalist Dot-Line:** Modern clean doodle style with solid dot eyes and single-stroke mouth.
- 🎞️ **Vintage Rubber-Hose 1930s:** Classic Cuphead-style pie-cut eyes where the cut-out wedge dynamically rotates towards the gaze direction!

### 2. 🧩 Modular Layer Toggles (Mouth-Only & Eye-Only Modes)
- **Problem:** Many objects in real life (or pre-drawn graphics) already have eyes, and only need a talking mouth!
- **Solution:** 4 independent layer toggles:
  - `[✓] Eyes Layer`
  - `[✓] Talking Mouth Layer`
  - `[✓] Eyebrows Layer`
  - `[✓] Cheeks / Blush Layer`
- When Eyes are toggled OFF, the engine exports a **Mouth-Only Alpha Video**, ready to drop directly under existing eyes!

### 3. 👀 Directional Gaze & Keyframing (Dialogue Staging)
- 9-directional gaze control pad (`↖ ↑ ↗` / `← ⊙ →` / `↙ ↓ ↘`).
- Have characters look left or right towards conversational partners with natural cubic easing transitions.
- Automatic **Poisson Eye Blinking** ($2.5\text{s} - 4.5\text{s}$) with 12% double-blink chance and subtle pupil micro-saccades.

### 4. 🚀 Professional Codecs for Video Editors
- 🍏 **Apple ProRes 4444 Alpha (`yuva444p12le`):** 12-bit uncompressed studio quality with zero-loss alpha channel. Drag and drop into Premiere Pro, Final Cut, and DaVinci Resolve without keying.
- 🌐 **WebM VP9 with Alpha (`yuva420p`):** Lightweight transparent video for CapCut and web applications.
- 🟢 **Chroma-Key Green Screen MP4 (`#00FF00`):** Constant 30.00 / 60.00 CFR frame rate for 1-click chroma key removal.
- 🖼️ **Direct Composite Overlay:** Upload a photo of a cucumber or tree directly into the studio, position the face, and download the finished scene!

---

## ⚡ Quick Start

### Prerequisites
- **Node.js:** v18+ (Node v20+ recommended)
- **Python:** 3.10+ (Python 3.12 recommended)
- **FFmpeg:** v5.0+ installed with `libvpx-vp9` and `prores_ks` support (`sudo apt install ffmpeg` on Ubuntu/Debian).

### 1. Clone the Repository
```bash
git clone https://github.com/codersagor24/doodle-lipsync-studio.git
cd doodle-lipsync-studio
```

### 2. Install Web Studio Frontend
```bash
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Setup Python Engine (for High-Quality Renders & Batch Processing)
```bash
python3 -m venv python_engine/venv --system-site-packages
python_engine/venv/bin/pip install numpy scipy soundfile fastapi uvicorn
```

---

## 📖 Step-by-Step User Guide

### 1. Upload or Select Voice Audio
- Click **"ভয়েস আপলোড"** to select any MP3, WAV, M4A, or OGG file.
- Or click **"লাইভ মাইক রেকর্ড"** to record your voice directly from your microphone.
- Or pick from the **"ডেমো ডায়ালগ"** dropdown for instant 1-click testing (Cucumber Story, Kawaii Speech, Comic Scream).

### 2. Choose Face Style & Customizations
- Select from the 5 style cards: *Classic Googly*, *Kawaii Chibi*, *Retro Comic*, *Minimalist*, or *Rubber-Hose 1930s*.
- Use the **Gaze Direction Pad** to point the eyes towards your subject or audience.
- Toggle **Layer Visibility** pills (e.g. disable eyes to get mouth-only).

### 3. Preview Live in Browser
- Hit **Play** (or press Space) to watch the character lip-sync in real time at 60 FPS.
- Use the timeline scrubber to inspect speech syllables (`AA`, `OO`, `EE`, `REST`).
- Click and drag the face on the canvas to position it on your object.

### 4. Export Video
- Click **"ভিডিও এক্সপোর্ট"** in the top right.
- Choose your format:
  - **Green Screen (#00FF00)** — Universal compatibility.
  - **Transparent WebM / ProRes** — Direct drag-and-drop zero-keying.
  - **Composite Overlay** — Baked directly onto your uploaded photo.
- Choose aspect ratio: **1:1 Square (1080×1080)**, **9:16 Shorts/Reels (1080×1920)**, or **16:9 Landscape (1920×1080)**.
- Click **"রেন্ডার শুরু করুন"** and download!

---

## 🎬 Video Editor Workflows

### CapCut (Desktop & Mobile)
1. **WebM Alpha Method (Zero Keying):** Export as *Transparent WebM*. Drag directly into CapCut on top of your cucumber/tree footage. It displays with transparency immediately!
2. **Green Screen Method:** Export as *Green Screen MP4*. In CapCut, select the clip, go to **Cutout > Chroma Key**, pick `#00FF00`, and set Strength to `15-20%`.

### Adobe Premiere Pro
1. Export as **Apple ProRes 4444 Alpha (.mov)** using the Python engine.
2. Drag the `.mov` into Premiere Pro.
3. Drop it directly on track `V2` over your footage on `V1`. The alpha channel works natively with zero keying, razor-sharp edges, and zero fringing!

### DaVinci Resolve
1. Import the ProRes 4444 or WebM Alpha file.
2. Drop onto the timeline. Resolve automatically detects the `Straight` or `Premultiplied` alpha channel.

---

## ⚡ High-Volume Batch Processing

For daily high-volume production of 20–50 videos:
1. Drop all your voiceover audio files into the `input_audio/` folder:
   ```
   input_audio/
   ├── cucumber_lesson_01.wav
   ├── tree_dialogue_02.mp3
   └── organ_explanation_03.wav
   ```
2. Run the Python batch runner:
   ```bash
   # Render all audio as Green Screen MP4
   python_engine/venv/bin/python -m python_engine.batch_runner --style googly --format greenscreen

   # Render all audio as Apple ProRes 4444 Alpha (Mouth-only)
   python_engine/venv/bin/python -m python_engine.batch_runner --style googly --format prores --no-eyes
   ```
3. All rendered videos appear in `output_videos/` with exact duration and sync.

---

## 🤖 AI Agents Collaboration

This repository was collaboratively designed and developed by a multi-agent team (**Human Creator + Claude Anthropic + Google Gemini Antigravity**).

- **For AI Agents:** Please read **[`AGENTS.md`](./AGENTS.md)** before modifying any files.
- **Architecture Specification:** Review **[`PROJECT_SPEC.md`](./PROJECT_SPEC.md)** and **[`PYTHON_ENGINE_SPEC.md`](./PYTHON_ENGINE_SPEC.md)**.
- **Shared Canonical Presets:** Found in **`presets/<style_id>.json`**.

---

## 📂 Repository Layout

```
doodle-lipsync-studio/
├── AGENTS.md                  # Comprehensive guide & contract for AI Agents
├── PROJECT_SPEC.md            # Master technical specification
├── PYTHON_ENGINE_SPEC.md      # PyCairo & FFmpeg export specification
├── presets/                   # Canonical JSON face geometries (single source of truth)
│   ├── googly.json
│   ├── kawaii.json
│   ├── comic.json
│   ├── minimalist.json
│   └── rubberhose.json
├── python_engine/             # Python Audio, PyCairo Vector & FFmpeg Exporter
│   ├── audio_engine.py        # RMS volume, acoustic FFT visemes, Poisson blinks
│   ├── frame_renderer.py      # PyCairo vector layer renderer (RGBA raw stream)
│   ├── video_exporter.py      # FFmpeg ProRes 4444 Alpha & WebM exporter
│   ├── batch_runner.py        # Bulk folder batch processing pipeline
│   └── server.py              # Local FastAPI REST server
├── src/                       # React / Vite Web Studio UI
│   ├── components/            # CanvasStage, AudioControls, PresetPicker, Timeline
│   ├── engine/                # Web Audio analyzer, live lip-sync & blink physics
│   └── presets/               # JS mirror of presets
├── input_audio/               # Drop voiceovers here for batch processing
├── output_videos/             # Rendered videos output directory
└── references/                # Visual artwork references
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
