// Offline deterministic video exporter — renders frame-by-frame from pre-analyzed audio data
// Uses the same renderFrame() engine as the live preview for pixel-perfect consistency

import { renderFrame } from './faceRenderer.js'
import { LipSyncEngine } from './lipSyncEngine.js'
import { BlinkPhysics } from './blinkPhysics.js'
import { STYLE_CONFIGS } from '../presets/facePresets.js'

export class VideoExporter {
  constructor() {
    this.isExporting = false
  }

  /**
   * Export video.
   * @param {Object} opts
   *   audioAnalyzer    - AudioAnalyzer instance (must have audioBuffer loaded)
   *   style            - style id string ('googly' | 'kawaii' | 'comic')
   *   moodTimeline     - [{time, mood}] sorted array
   *   gazeMarkers      - [{time, gaze:{x,y}}] sorted array
   *   faceTransform    - {x, y, scale} in 1080px coords
   *   layers           - {eyes, mouth, eyebrows, cheeks} bool flags
   *   exportFormat     - 'greenscreen' | 'transparent' | 'composite'
   *   backgroundImage  - HTMLImageElement or null
   *   resolution       - {width, height} default 1080x1080
   *   fps              - 24 | 30 | 60
   *   onProgress       - callback(0–100)
   */
  async exportVideo({
    audioAnalyzer,
    style = 'googly',
    moodTimeline = [],
    gazeMarkers = [],
    faceTransform = { x: 540, y: 540, scale: 1.0 },
    layers = {},
    exportFormat = 'greenscreen',
    backgroundImage = null,
    resolution = { width: 1080, height: 1080 },
    fps = 30,
    onProgress = () => {},
  }) {
    if (!audioAnalyzer?.audioBuffer) {
      throw new Error('No audio buffer loaded')
    }

    this.isExporting = true
    const { width, height } = resolution
    const duration = audioAnalyzer.audioBuffer.duration
    const totalFrames = Math.ceil(duration * fps)

    // 1. Pre-analyze all audio frames offline (deterministic)
    onProgress(0)
    const frameDataArray = await audioAnalyzer.extractFrameData(fps)

    // 2. Offscreen canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { alpha: true })

    // 3. Audio stream for MediaRecorder sync
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const audioCtx = new AudioCtx()
    const audioSource = audioCtx.createBufferSource()
    audioSource.buffer = audioAnalyzer.audioBuffer
    const streamDest = audioCtx.createMediaStreamDestination()
    audioSource.connect(streamDest)

    // 4. MediaRecorder on canvas stream + audio
    const canvasStream = canvas.captureStream(fps)
    const audioTrack = streamDest.stream.getAudioTracks()[0]
    if (audioTrack) canvasStream.addTrack(audioTrack)

    const mimeType = this._pickMimeType(exportFormat)
    const chunks = []
    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 12_000_000,
    })
    recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data) }

    const recordDone = new Promise((resolve, reject) => {
      recorder.onstop = () => {
        audioCtx.close()
        this.isExporting = false
        resolve(new Blob(chunks, { type: mimeType }))
      }
      recorder.onerror = (err) => { audioCtx.close(); this.isExporting = false; reject(err) }
    })

    // 5. Rendering engines (stateful, deterministic)
    const lipSync = new LipSyncEngine()
    const blink = new BlinkPhysics()
    const config = STYLE_CONFIGS[style] || STYLE_CONFIGS.googly

    const getMoodAt = (t) => {
      if (!moodTimeline.length) return 'normal'
      let active = 'normal'
      for (const m of moodTimeline) { if (t >= m.time) active = m.mood }
      return active
    }

    const getGazeAt = (t) => {
      if (!gazeMarkers.length) return { x: 0, y: 0 }
      const sorted = [...gazeMarkers].sort((a, b) => a.time - b.time)
      if (t <= sorted[0].time) return { ...sorted[0].gaze }
      const last = sorted[sorted.length - 1]
      if (t >= last.time) return { ...last.gaze }
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i], b = sorted[i + 1]
        if (t >= a.time && t <= b.time) {
          const p = (t - a.time) / (b.time - a.time)
          const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
          return { x: a.gaze.x + (b.gaze.x - a.gaze.x) * e, y: a.gaze.y + (b.gaze.y - a.gaze.y) * e }
        }
      }
      return { x: 0, y: 0 }
    }

    recorder.start(100)
    audioSource.start(0)

    const startMs = performance.now()
    const frameMs = 1000 / fps

    for (let frame = 0; frame < totalFrames; frame++) {
      if (!this.isExporting) break

      const t = frame / fps
      onProgress(Math.round((frame / totalFrames) * 100))

      const rawFrame = frameDataArray[frame] || { rms: 0 }
      const audioMetrics = {
        rms: rawFrame.rms,
        viseme: rawFrame.rms > 0.04 ? 'AA' : 'REST',
        lowEnergy: rawFrame.rms * 0.6,
        highEnergy: rawFrame.rms * 0.3,
      }

      const mouthParams = lipSync.update(audioMetrics)
      const blinkState  = blink.update(t)
      const mood        = getMoodAt(t)
      const gazeOffset  = getGazeAt(t)

      const scaleRatio = width / 1080
      renderFrame(ctx, {
        style,
        config,
        mouthParams,
        eyeState: { blinkProgress: blinkState.blinkProgress, saccadeOffset: blinkState.saccadeOffset },
        mood,
        cx:        faceTransform.x * scaleRatio,
        cy:        faceTransform.y * scaleRatio,
        faceScale: faceTransform.scale * scaleRatio,
        bgMode:    exportFormat,
        bgImage:   backgroundImage,
        canvasW:   width,
        canvasH:   height,
        layers,
        gazeOffset,
      })

      const wait = startMs + (frame + 1) * frameMs - performance.now()
      if (wait > 0) await new Promise(r => setTimeout(r, wait))
    }

    recorder.stop()
    const blob = await recordDone
    return blob
  }

  cancel() { this.isExporting = false }

  _pickMimeType(format) {
    const candidates =
      format === 'transparent'
        ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
        : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    return candidates.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm'
  }

  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}
