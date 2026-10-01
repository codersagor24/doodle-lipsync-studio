# 📜 COMPLETE CONVERSATION HISTORY & PROJECT HANDOFF GUIDE
## Project: Doodle Lip-Sync Studio (Talking Object Rig)
**Repository:** `https://github.com/codersagor24/doodle-lipsync-studio`  
**Creator / Project Lead:** `@codersagor24` (Human Creator)  
**Contributing AI Agents:** Google Gemini (Antigravity) & Claude (Anthropic)  
**Last Updated:** October 1, 2026  

---

> [!IMPORTANT]
> **FOR NEW ANTIGRAVITY OR AI AGENT SESSIONS:**  
> If you are an AI assistant opening this repository in a new Antigravity / Claude / Cursor / IDE session, **READ THIS DOCUMENT FIRST**.  
> This file contains the complete backstory, all strategic requirements decided by the Human Creator, every architectural decision made, the exact state of the code, and clear guidelines on how to seamlessly resume development without repeating past mistakes.

---

## 1. Project Mission & The Real-World Problem

### 1.1 The Business & Production Context
The creator produces a **high daily volume of educational and entertaining cartoon videos** where everyday inanimate objects, flora, and tools come alive to speak with cartoon facial features:
- **Cucumbers hanging on vines** talking to trees.
- **Banana trees and forest trees** conversing with a woodcutter's **axe**.
- **Human internal organs / anatomy** explaining medical and biological science.
- **Tools, fruits, vegetables, and household objects** engaged in dialogues.

### 1.2 Why Traditional Tools Failed
1. **Adobe After Effects:** Importing face assets, manually tracking object position, baking audio amplitude keyframes, and tuning visemes takes **30–45 minutes per scene**, which makes daily high-volume production impossible.
2. **Generative AI Video Models (SadTalker, LivePortrait, Runway):** Trained exclusively on human facial landmarks. When given a vegetable or cartoon tree, they fail, distort, or blur the background into an unusable mess.

### 1.3 The Chosen Solution (Dual-Engine Architecture)
- **Frontend (React 19 + HTML5 Canvas 2D):** Instant, buttery-smooth 60 FPS live interactive preview in the browser. Allows clicking & dragging faces directly on uploaded photos, previewing lip-sync, toggling layers, and adjusting gaze direction without waiting for backend rendering.
- **Backend (Python 3.12 + PyCairo + FFmpeg):** Solves browser limitations by producing broadcast-quality **Apple ProRes 4444 (12-bit Alpha Channel MOV)**, **WebM VP9 Alpha**, and **Chroma-Key Green Screen MP4** at exact constant frame rates (CFR 30/60) with zero audio drift, plus high-volume **multi-file batch rendering**.

---

## 2. Chronological Conversation Trajectory & Decision Log

### Phase 0: The Initial Conflict & White Screen Incident
- **Event:** Initially, Gemini and Claude both began writing code in `src/` simultaneously without prior coordination or clear ownership boundaries.
- **Result:** Class and export mismatches occurred (`STYLE_CONFIGS` vs `FACE_PRESETS`, named vs default exports, diverging method names in audio analyzers). The React app crashed with runtime errors, resulting in a **blank white screen** on `http://127.0.0.1:5173/`.
- **Creator Intervention:** The creator intervened immediately with critical feedback:
  > *"তোমরা পুরো প্ল্যানিং না করে কাজ শুরু করে দিবা, এটা একদম ঠিক না। তুমি আর ক্লাউড মিলে পরিকল্পনা করো... ফোল্ডারে ক্লাউডের জন্য নোট তৈরি করো... আমি চাচ্ছিলাম বিষয়টা যদি পাইথনে করা যেত তাহলে সুবিধা হইতো... আমি এটা দেখার পরে ফাইনালাইজ করি, এরপরে বলব যখন শুরু করো, তখন কোড শুরু করবা।"*
- **Action Taken:** All coding was halted immediately. A file-based communication protocol was established via `NOTES_FOR_CLAUDE.md` and `NOTES_FROM_CLAUDE.md`.

---

### Phase 1: Collaborative Alignment on the Hybrid Architecture
Both agents and the creator evaluated three architectural routes:
- **Option A (Hybrid: Python Backend + React Canvas Web UI) — SELECTED & ADOPTED:**
  * Live Preview: In-browser Web Audio API + HTML5 Canvas (instant feedback, drag-to-position).
  * Final Export & Batch: Python + Librosa/Scipy + PyCairo + FFmpeg (Apple ProRes 4444 Alpha, WebM VP9 Alpha, Green Screen MP4, batch folder processing).
- **Option B (Pure Python Desktop):** Rejected because native GUI canvas is less fluid for web-like free-form transforms.
- **Option C (Pure Web):** Rejected because browser `MediaRecorder` cannot output ProRes 4444 Alpha and chokes on bulk batch jobs.

---

### Phase 2: Creator's 6 Strategic Feature Directives

During the alignment phase, the creator contributed 6 key architectural requirements:

1. **Modular Layer Toggles (Selective Element Rendering):**
   - Objects often already have physical or drawn eyes (e.g. real cucumber eyes). The creator must be able to toggle off Eyes and export **Mouth-Only Alpha Videos**!
   - Layers: `[✓] Eyes`, `[✓] Mouth`, `[✓] Eyebrows`, `[✓] Cheeks`.
2. **Directional Gaze & Keyframing (Dialogue Staging):**
   - When Character A is on the left talking to Character B on the right, the speaker must look right (`→`).
   - Needs a 9-directional gaze pad (`↖ ↑ ↗ / ← ⊙ → / ↙ ↓ ↘`) with smooth cubic easing and Poisson eye blinking.
3. **Multi-Character Scene Support (Speaker 1 vs Speaker 2):**
   - **Tier 1 (Modular Single-Character Export):** Export Speaker 1's alpha video, export Speaker 2's alpha video, stack in video editor. (Implemented first).
   - **Tier 2 (Integrated Multi-Character Scene Studio):** Stage allows adding Character A & B, with dialogue turn-taking markers on the audio timeline.
4. **Free-Form Canvas Transform Box (Figma/Photoshop Style):**
   - Instead of rigid +/- buttons, clicking a character on canvas reveals a bounding box with 4 corner scale handles, center drag, and top rotation handle to fit slanted objects.
5. **After Effects Extension (CEP/UXP Panel):**
   - The React studio can be packaged as an Adobe CEP extension (`.zxp`) running inside After Effects (`Window > Extensions`), rendering ProRes 4444 Alpha directly onto the active comp timeline via ExtendScript.
6. **Expanded Face Library (10+ Vector Styles):**
   - Expand beyond 3 styles to 10+ expressive caricature styles (Googly, Kawaii, Retro Comic, Minimalist Dot-Line, Rubber-Hose 1930s, Meme Screamer, Cute Animal, Smug, Chibi Emoji, Custom SVG Slot).

---

### Phase 3: What Was Built & Verified

Both agents divided ownership cleanly:
- **Claude's Implementation in `src/`:**
  - Resolved all syntax and import collisions; fixed the white screen.
  - Implemented Layer Toggles (4 pill buttons for Eyes, Mouth, Eyebrows, Cheeks).
  - Implemented 9-directional Gaze Pad with cubic easing interpolation in `CanvasStage.jsx`.
  - Implemented Style D (*Minimalist Dot-Line*) and Style E (*Vintage Rubber-Hose 1930s* with gaze-rotating pie-cut wedges).
  - Cleaned up redundant files (`src/engine/blinkEngine.js`).
- **Gemini's Implementation in `python_engine/` & `presets/`:**
  - Created shared canonical JSON presets: `presets/googly.json`, `kawaii.json`, `comic.json`, `minimalist.json`, `rubberhose.json`.
  - Configured Python 3.12 environment with `python3-cairo 1.25.1`, `numpy`, `scipy`, `soundfile`, `fastapi`, `uvicorn`.
  - Built `python_engine/audio_engine.py`: Audio loading via soundfile/ffmpeg, RMS volume envelope, zero-crossing rate, FFT spectral energy, VAD silence gating, and Poisson blink generator.
  - Built `python_engine/frame_renderer.py`: PyCairo vector layer renderer supporting all 5 styles, layer toggles, free-form transform, and gaze-aware pie-wedge rotation.
  - Built `python_engine/video_exporter.py`: Streams RGBA frames directly into FFmpeg stdin.
  - Built `python_engine/batch_runner.py`: Multi-file folder processor (`input_audio/` -> `output_videos/`).
  - Built `python_engine/server.py`: FastAPI local REST server (`/api/status`, `/api/presets`, `/api/analyze-audio`, `/api/render-video`).
- **Breakthrough Verification Results (FFprobe Confirmed):**
  - 🍏 **Apple ProRes 4444 Alpha MOV:** Verified codec `prores`, pixel format `yuva444p12le` (12-bit alpha channel), uncompressed PCM audio.
  - 🌐 **WebM VP9 Alpha:** Verified codec `vp9`, pixel format `yuva420p`, Opus audio.
  - 🟢 **Green Screen MP4:** Verified codec `h264`, constant 30.00 FPS, `#00FF00` chroma key.
  - 👄 **Mouth-Only Alpha Test:** Successfully rendered video with `layers={'eyes': False, 'mouth': True}` with zero eyes, perfectly ready to overlay on pre-eyed vegetables.
- **GitHub Launch:**
  - Created repository `https://github.com/codersagor24/doodle-lipsync-studio`.
  - Published as **Public**.
  - Pushed complete codebase, `README.md` with full user guides & editor integration tutorials, and `AGENTS.md` operational contract.

---

## 3. Strict Multi-Agent Rules & File Ownership

When working on this repository, all AI agents **MUST** respect these strict boundaries:

```
[Claude Domain]
  ├── src/components/            # UI components (CanvasStage, TransformBox, GazePad, AudioControls)
  ├── src/engine/faceRenderer.js # HTML5 Canvas 2D vector drawing & Bezier curves
  └── src/presets/facePresets.js # JS adapter mirroring presets/*.json

[Gemini Domain]
  ├── python_engine/audio_engine.py   # RMS volume, acoustic FFT visemes, Poisson blinks
  ├── python_engine/frame_renderer.py # PyCairo vector layer rendering
  ├── python_engine/video_exporter.py # FFmpeg streaming pipeline (ProRes 4444 Alpha, WebM)
  ├── python_engine/batch_runner.py   # Multi-file batch folder runner
  └── python_engine/server.py         # Local FastAPI REST server

[Shared Single Source of Truth]
  └── presets/<style_id>.json    # Canonical vector geometry & style parameters
```

### Golden Rules:
1. **Never edit files outside your assigned domain** without logging a handoff in `NOTES_FOR_CLAUDE.md` or `NOTES_FROM_CLAUDE.md`.
2. **Never hardcode face style geometry in JS or Python code.** Always define the canonical geometry in `/presets/<style_id>.json`. Both engines read from this shared schema.
3. **Always honor layer toggles:**
   ```js
   if (layers?.eyes !== false)     { /* draw eyes */ }
   if (layers?.mouth !== false)    { /* draw mouth */ }
   if (layers?.eyebrows !== false) { /* draw eyebrows */ }
   if (layers?.cheeks !== false)   { /* draw blush */ }
   ```
4. **Deterministic Rendering:** Frame render loops must never use unseeded `Math.random()`. Blinks, saccades, and gaze must be precomputed and synchronized via the frame data.

---

## 4. Current State & What Has Been Tested

| Component | Status | Verification Method |
|---|---|---|
| **Vite Dev Server** (`localhost:5173`) | ✅ Functional | `npm run build` succeeds (code 0); `curl http://127.0.0.1:5173/` returns `200 OK`. |
| **Layer Toggles (Eyes/Mouth/Brows/Cheeks)** | ✅ Functional | Tested in browser and verified in Python export (`--no-eyes`). |
| **Directional Gaze Pad** | ✅ Functional | 9-way D-pad operational; Rubber-Hose pie cut rotates with gaze angle. |
| **5 Built-in Face Styles** | ✅ Functional | Googly, Kawaii, Comic, Minimalist, Rubber-Hose in both Canvas and PyCairo. |
| **ProRes 4444 Alpha Export** | ✅ Functional | `output_videos/test_cucumber_prores.mov` verified with `ffprobe` (`yuva444p12le`). |
| **WebM VP9 Alpha Export** | ✅ Functional | `output_videos/test_cucumber_alpha.webm` verified with `ffprobe` (`yuva420p`). |
| **Green Screen MP4 Export** | ✅ Functional | `output_videos/test_cucumber_greenscreen.mp4` verified with `ffprobe` (`h264`, CFR 30fps). |
| **Python Batch Processor** | ✅ Functional | `python_engine/batch_runner.py` operational. |
| **GitHub Repository** | ✅ Public | Live at `https://github.com/codersagor24/doodle-lipsync-studio`. |

---

## 5. Next Steps / Roadmap for Future Sessions

When a new Antigravity or AI agent session continues this project, here is the prioritized task backlog:

### Priority 1: Free-Form Canvas Transform Box (Phase 2)
- Implement an interactive `<TransformBox>` on the canvas stage:
  - 4 corner handles for scaling (with Shift for uniform aspect ratio lock).
  - Center drag area for repositioning.
  - Top rotation handle (+30px above box) for tilting the face on slanted objects/vines.
  - Pass the resulting `{ cx, cy, scale_x, scale_y, rotation }` to the export payload so the exported video matches the canvas layout pixel-for-pixel.

### Priority 2: Gaze & Mood Keyframe Timeline (Phase 2)
- Add a dedicated **Gaze Track** below the Mood Track on the timeline.
- Allow clicking any timestamp to place a gaze stamp (`← → ↑ ↓ ⊙`).
- Interpolate smoothly between keyframes during playback and export.

### Priority 3: Expand Styles to 10+ (Phase 3)
- Add remaining styles:
  * Style 6: **Meme Screamer** (bulging eyes, drooping wide jaw).
  * Style 7: **Cute Animal / Frog** (cat/frog smile, fang tooth accents).
  * Style 8: **Suspicious / Smug** (half-lidded eyes, cocked eyebrow, smirk).
  * Style 9: **Chibi Tearful / Emoji** (starry eyes, weeping tear streams).
  * Style 10: **Custom SVG Slot** (user uploads SVG paths for rest and open mouth; engine morphs between them).

### Priority 4: Multi-Character Staging (Phase 4, Tier 2)
- Enable adding Character A and Character B on the same canvas stage.
- Add speaker markers on the timeline so Character 1 talks while Character 2 listens, and vice-versa.

### Priority 5: After Effects CEP Extension Packaging (Phase 4)
- Add `CSInterface.js` and `manifest.xml` to package the web studio into an Adobe CEP panel.
- Wire the "Insert to Comp" button to invoke the Python ProRes 4444 exporter and import the footage directly into the active composition.

---

## 6. How to Run & Test (Quick Reference)

```bash
# 1. Start Web Studio Frontend:
npm run dev

# 2. Build Frontend for Production:
npm run build

# 3. Test Python Vector Frame Rendering:
python_engine/venv/bin/python -c "
from python_engine.frame_renderer import FrameRenderer
r = FrameRenderer.from_preset_file('presets/googly.json')
raw = r.render_frame({'blink': 0, 'open_y': 0.5, 'width_x': 1, 'gaze_x': 0, 'gaze_y': 0, 'pupil_x': 0, 'pupil_y': 0})
assert len(raw) == 1080 * 1080 * 4
print('PyCairo render verified!')
"

# 4. Test Python ProRes 4444 Alpha Export:
python_engine/venv/bin/python -c "
from python_engine.video_exporter import VideoExporter
exporter = VideoExporter(fps=30, resolution=(720, 720))
res = exporter.export(
    audio_file='input_audio/test_cucumber.wav',
    preset_path='presets/googly.json',
    output_path='output_videos/test_cucumber_prores.mov',
    export_format='prores'
)
print('ProRes export verified:', res)
"

# 5. Run Batch Renderer:
python_engine/venv/bin/python -m python_engine.batch_runner --style googly --format greenscreen
```

---

*This document was generated automatically to preserve all context, decisions, and instructions for future Antigravity and AI agent sessions.*
