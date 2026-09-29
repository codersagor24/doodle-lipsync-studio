# 📢 NOTES FROM CLAUDE — PHASE 1 IMPLEMENTATION COMPLETE
**Date:** September 28, 2026  
**Status:** ✅ **PHASE 1 CORE FEATURES SHIPPED — LIVE AT localhost:5173**

---

## What I Built in This Session

### 1. Layer Toggles — DONE ✅
`renderFrame()` now accepts `layers: { eyes, mouth, eyebrows, cheeks }`.
Every face style guards each draw call:
```js
if (layers?.eyes !== false) { /* draw eyes */ }
if (layers?.mouth !== false) { /* draw mouth */ }
if (layers?.eyebrows !== false) { /* draw brows (Comic + Rubber-Hose only) */ }
if (layers?.cheeks !== false) { /* draw blush (Kawaii only) */ }
```
UI: 4 toggle pills in the right panel. Tested and confirmed working on all 3 original styles.

**For your Python `frame_renderer.py`:** The `layers` dict is already in our contract.
The existing code in `frame_renderer.py` already has this structure — no changes needed!

---

### 2. Gaze Direction — DONE ✅
`renderFrame()` now accepts `gazeOffset: { x, y }` in normalized units [-1, 1].

**How it works per style:**
- Googly: gaze scales to ±18px X, ±10px Y (added to Poisson saccade offset)  
- Kawaii: ±14px X, ±8px Y
- Comic: ±16px X, ±9px Y
- Minimalist: ±10px X, ±6px Y
- Rubber-Hose: ±16px X, ±9px Y (also rotates the pie-cut wedge angle!)

**For Rubber-Hose:** The pie-cut iris window uses `Math.atan2(sy, sx)` to compute the angle, so the "pupil" actually rotates to face the gaze direction. This is the correct behavior for this style.

**Timeline markers (gaze):** The `CanvasStage.jsx` has full cubic easing interpolation:
```js
function interpolateGaze(gazeMarkers, currentTime) {
  // ... cubic ease-in-out between consecutive markers
}
```
You can pass `gazeMarkers: [{time: 0, gaze:{x:0,y:0}}, {time: 2.5, gaze:{x:1,y:0}}]`
to CanvasStage and it will smoothly interpolate between them.

**UI:** 9-button direction pad (↖↑↗ / ←⊙→ / ↙↓↘) in the right controls panel.

**For Python renderer:** Pre-compute gaze per frame using the same cubic interpolation,
then pass `gaze_x` and `gaze_y` to `_draw_eyes()`. For Rubber-Hose, use:
```python
pupil_angle = math.atan2(gaze_y * 9, gaze_x * 16)
```

---

### 3. Fixed videoExporter.js — DONE ✅
The original file had broken API calls. Completely rewritten in `src/engine/videoExporter.js`:
- Uses `renderFrame()` (not `FaceRenderer.render()`)
- Uses `audioAnalyzer.extractFrameData(fps)` for offline deterministic frame analysis
- Uses `lipSync.update(frameData)` with correct single-argument call
- Passes `layers` and `gazeMarkers` through for consistent export
- Still uses `MediaRecorder` for browser-side export (consistent with `Recorder`)

---

### 4. Two New Face Styles — DONE ✅

#### Style D: Minimalist Dot-Line (`minimalist`)
```js
eyeRadius: 22, leftEye: {x:-70,y:-60}, rightEye: {x:70,y:-60}
mouthCenter: {x:0,y:80}, mouthWidth: 80
eyebrowEnabled: false, cheeksEnabled: false
```
Eye shape: small solid circle with highlight. Mouth: single quadratic curve for rest, ellipse for open.

#### Style E: Rubber-Hose 1930s (`rubberhose`)
```js
eyeRadius: 52, pieAngle: 55, leftEye:{x:-78,y:-62}, rightEye:{x:78,y:-62}
mouthCenter: {x:0,y:85}, mouthWidth: 110
eyebrowEnabled: true, eyebrowLeft:{x:-78,y:-126}, eyebrowRight:{x:78,y:-126}
```
Eye shape: solid black circle + white pie-cut sector that **rotates with gaze direction**.
Pie wedge uses `Math.atan2(gazeY, gazeX)` — fully gaze-aware.

**For your Python `frame_renderer.py` — new shapes to implement:**

**Minimalist eye:**
```python
def _draw_minimalist_eye(self, ctx, ex, ey, blink_progress, sx, sy):
    r = self.preset["eyes"]["radius"]
    ctx.arc(ex, ey, r, 0, 2 * math.pi)
    ctx.set_source_rgb(0.07, 0.07, 0.07)
    ctx.fill()
    # Highlight dot
    ctx.arc(ex + 4, ey - 4, 3, 0, 2 * math.pi)
    ctx.set_source_rgba(1, 1, 1, 0.9)
    ctx.fill()
```

**Rubber-Hose eye:**
```python
def _draw_rubberhose_eye(self, ctx, ex, ey, blink_progress, sx, sy):
    r = self.preset["eyes"]["radius"]
    pie_angle = math.radians(self.preset["eyes"]["pie_angle"])
    pupil_angle = math.atan2(sy, sx)
    # Draw black circle
    ctx.arc(ex, ey, r, 0, 2 * math.pi)
    ctx.set_source_rgb(0.07, 0.07, 0.07)
    ctx.fill()
    # Draw white pie wedge
    ctx.move_to(ex, ey)
    ctx.arc(ex, ey, r - 3, pupil_angle - pie_angle/2, pupil_angle + pie_angle/2)
    ctx.close_path()
    ctx.set_source_rgb(1, 1, 1)
    ctx.fill()
```

---

### 5. Bug Fix: Duplicate `startY` Declaration — DONE ✅
`drawComicEyebrow()` had `let startY = 0` AND `const startY = ...` — removed the `let` version.
This was causing `SyntaxError: Identifier 'startY' has already been declared`.

---

## Current File Ownership (Updated)

| File | Owner | Status |
|------|-------|--------|
| `src/engine/faceRenderer.js` | Claude | ✅ 5 styles, layers + gaze |
| `src/engine/videoExporter.js` | Claude (fixed Gemini's) | ✅ Rewritten |
| `src/engine/lipSyncEngine.js` | Claude | No changes |
| `src/engine/audioAnalyzer.js` | Claude | No changes |
| `src/engine/recorder.js` | Claude | No changes |
| `src/engine/blinkPhysics.js` | **Gemini** | DO NOT MODIFY |
| `src/engine/blinkEngine.js` | Gemini (unused) | Can be deleted |
| `src/presets/facePresets.js` | Claude (joint) | ✅ 5 styles |
| `src/components/App.jsx` | Claude | ✅ layers + gaze UI |
| `src/components/CanvasStage.jsx` | Claude | ✅ gaze interpolation |
| `src/components/Timeline.jsx` | Claude | No changes yet |
| `python_engine/` | **Gemini** | DO NOT MODIFY |
| `presets/*.json` | **Gemini** | Add minimalist.json + rubberhose.json |

---

## What I Need From You Next (Gemini)

1. **Create `/presets/minimalist.json` and `/presets/rubberhose.json`** using the coordinate values and shape params I described above. Match the `googly.json` schema with `id`, `eyes`, `mouth`, `eyebrows`, `cheeks` fields.

2. **Add Minimalist + Rubber-Hose support to `python/frame_renderer.py`** using the draw functions I wrote above.

3. **Implement the gaze-direction in Python:** For Rubber-Hose, the pie-wedge angle = `atan2(gaze_y * 9, gaze_x * 16)`. For other styles, it's a pixel offset added to pupil position.

4. **The `blinkEngine.js`** file in `src/engine/` seems to be an old/duplicate file. Is it safe to delete? If you don't need it, I'll remove it.

---

## Next Steps From My Side (Phase 2)

- [ ] **Free-form canvas transform box** — drag handles overlay on top of canvas
- [ ] **Gaze markers on Timeline** — second track row, time-stamped gaze changes  
- [ ] **More face styles** (#6 Meme/Screamer, #7 Cute Animal)
- [ ] **Server API integration** — wire up Export button to Python backend (port 8000)

— Claude (Anthropic), Session September 28, 2026
