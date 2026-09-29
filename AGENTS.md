# 🤖 GUIDE & OPERATIONAL CONTRACT FOR AI AGENTS
## Project: Doodle Lip-Sync Studio (Talking Object Rig)
**Repository:** `codersagor24/doodle-lipsync-studio`

---

## 1. Mission & Core Context
**Doodle Lip-Sync Studio** is built for a real-world, high-volume production workflow where educators and animators produce daily videos of inanimate objects—**cucumbers on vines, banana trees, axes, human organs, and tools**—coming alive as talking characters.

### Why This Dual-Engine Architecture Was Chosen:
- **Browser-side (React + HTML5 Canvas):** Provides instant, buttery-smooth 60 FPS live interactive preview, on-canvas face positioning, layer toggling (e.g. mouth-only mode), and directional gaze pads without waiting for backend rendering.
- **Python-side (PyCairo + FFmpeg):** Solves the browser's limitation by outputting **Apple ProRes 4444 (12-bit Alpha Channel MOV)**, **WebM VP9 Alpha**, and **Chroma-Key Green Screen MP4** at exact constant frame rates (CFR 30/60) with zero audio drift, plus multi-file **batch processing**.

---

## 2. Strict Multi-Agent Rules & Ownership Division

To prevent code collisions and race conditions between autonomous AI agents (Claude, Gemini, Codex, etc.), all contributing agents **MUST** follow these rules:

### 2.1 File Ownership Boundaries

```
[Claude (Anthropic) Domain]
  ├── src/components/            # UI components (CanvasStage, TransformBox, GazePad, AudioControls)
  ├── src/engine/faceRenderer.js # HTML5 Canvas 2D vector drawing & Bezier curves
  └── src/presets/facePresets.js # JS adapter mirroring presets/*.json

[Gemini (Antigravity) Domain]
  ├── python_engine/audio_engine.py   # RMS volume, acoustic FFT visemes, Poisson blinks
  ├── python_engine/frame_renderer.py # PyCairo vector layer rendering
  ├── python_engine/video_exporter.py # FFmpeg streaming pipeline (ProRes 4444 Alpha, WebM)
  ├── python_engine/batch_runner.py   # Multi-file batch folder runner
  └── python_engine/server.py         # Local FastAPI REST server

[Shared Single Source of Truth]
  └── presets/<style_id>.json    # Canonical vector geometry & style parameters
```

### 2.2 Operational Rules
1. **Never edit files outside your assigned domain** without explicitly logging a handoff in `NOTES_FOR_CLAUDE.md` or `NOTES_FROM_CLAUDE.md`.
2. **Never modify face styling parameters in JS or Python code directly.** Always modify the canonical JSON in `/presets/<style_id>.json`. Both engines read from this shared schema.
3. **Always preserve Layer Toggling:** Every draw routine must honor the `layers` dict:
   ```js
   if (layers?.eyes !== false)     { /* draw eyes */ }
   if (layers?.mouth !== false)    { /* draw mouth */ }
   if (layers?.eyebrows !== false) { /* draw eyebrows */ }
   if (layers?.cheeks !== false)   { /* draw blush */ }
   ```
4. **Deterministic Export Requirement:** The Python export engine must produce identical visual frames to the browser canvas. Never use unseeded randomness inside the frame render loop.

---

## 3. Data Contracts & Shared Schemas

### 3.1 Canonical Preset JSON (`presets/<style_id>.json`)
```json
{
  "id": "googly",
  "name": "Classic Googly",
  "emoji": "🥒",
  "description": "Talking doodle style for cucumbers and trees",
  "eyes": {
    "shape": "circle",
    "left": { "x": -82, "y": -62 },
    "right": { "x": 82, "y": -62 },
    "radius": 40,
    "pupil_radius": 14,
    "eye_stroke": 4.5,
    "eye_color": "#ffffff",
    "pupil_color": "#111111",
    "highlight_radius": 5,
    "highlight_offset": { "x": 6, "y": -6 },
    "has_eyelid_line": true
  },
  "mouth": {
    "shape": "cartoon_open",
    "center": { "x": 0, "y": 68 },
    "base_width": 72,
    "max_open_height": 52,
    "mouth_color": "#181114",
    "tongue_color": "#ef4444",
    "teeth_color": "#ffffff",
    "stroke_color": "#111111",
    "stroke_width": 4.5
  },
  "eyebrows": {
    "enabled": true,
    "left": { "x": -82, "y": -118 },
    "right": { "x": 82, "y": -118 },
    "width": 34,
    "thickness": 5,
    "color": "#111111"
  },
  "cheeks": {
    "enabled": false,
    "color": "rgba(255, 100, 100, 0.3)"
  }
}
```

### 3.2 Acoustic Viseme Frame Contract (Engine Output)
```json
{
  "frame": 12,
  "time": 0.400,
  "rms": 0.620,
  "viseme": "AA",
  "open_y": 0.78,
  "width_x": 1.05,
  "roundness": 0.2,
  "is_silent": false,
  "blink": 0.0,
  "pupil_x": 1.2,
  "pupil_y": -0.5,
  "gaze_x": 1.0,
  "gaze_y": 0.0
}
```

---

## 4. How to Add a New Character Face Style in 3 Steps

When expanding the face library (e.g. adding Meme Screamer, Cute Frog, or Smug):

1. **Step 1: Create Canonical JSON**
   - Create `presets/<new_style_id>.json` matching the schema in Section 3.1.
   - Choose or define the `shape` identifiers for eyes and mouth.
2. **Step 2: Add Browser Canvas Draw Routine (Claude)**
   - In `src/engine/faceRenderer.js`, add the shape handler under `drawEyes()` and `drawMouth()`.
   - Update `src/presets/facePresets.js` to register the new style in the UI picker.
3. **Step 3: Add Python PyCairo Draw Routine (Gemini)**
   - In `python_engine/frame_renderer.py`, implement the matching PyCairo vector draw calls.
   - Run verification test:
     ```bash
     python_engine/venv/bin/python -c "
     from python_engine.frame_renderer import FrameRenderer
     r = FrameRenderer.from_preset_file('presets/<new_style_id>.json')
     raw = r.render_frame({'blink': 0, 'open_y': 0.5, 'width_x': 1, 'gaze_x': 0, 'gaze_y': 0, 'pupil_x': 0, 'pupil_y': 0})
     assert len(raw) == 1080 * 1080 * 4
     print('Style verified!')
     "
     ```

---

## 5. Verification Commands Before Submitting Changes

```bash
# 1. Verify frontend builds without bundling or syntax errors:
npm run build

# 2. Verify Python engine renders ProRes 4444 and WebM Alpha:
python_engine/venv/bin/python -c "
from python_engine.video_exporter import VideoExporter
exporter = VideoExporter(fps=30, resolution=(720, 720))
res = exporter.export(
    audio_file='input_audio/test_cucumber.wav',
    preset_path='presets/googly.json',
    output_path='output_videos/test_verify.mov',
    export_format='prores'
)
assert res['status'] == 'success'
print('ProRes 4444 verification passed!')
"

# 3. Check video stream with ffprobe:
ffprobe -v error -show_entries stream=codec_name,pix_fmt -of json output_videos/test_verify.mov
```

Maintain documentation integrity and keep commit messages clear and descriptive.
