import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { renderFrame } from '../engine/faceRenderer'
import { LipSyncEngine } from '../engine/lipSyncEngine'
import { BlinkPhysics } from '../engine/blinkPhysics'
import { STYLE_CONFIGS } from '../presets/facePresets'

const CANVAS_W = 1080
const CANVAS_H = 1080

function interpolateGaze(gazeMarkers, currentTime) {
  if (!gazeMarkers || gazeMarkers.length === 0) return { x: 0, y: 0 }
  const sorted = [...gazeMarkers].sort((a, b) => a.time - b.time)
  if (currentTime <= sorted[0].time) return { ...sorted[0].gaze }
  const last = sorted[sorted.length - 1]
  if (currentTime >= last.time) return { ...last.gaze }
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1]
    if (currentTime >= a.time && currentTime <= b.time) {
      const t = (currentTime - a.time) / (b.time - a.time)
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      return { x: a.gaze.x + (b.gaze.x - a.gaze.x) * e, y: a.gaze.y + (b.gaze.y - a.gaze.y) * e }
    }
  }
  return { x: 0, y: 0 }
}

const CanvasStage = forwardRef(function CanvasStage(
  { style, mood, audioAnalyzer, isPlaying, bgMode, bgImage, facePos, layers, gazeMarkers, onTimeUpdate },
  ref
) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const lipSync   = useRef(new LipSyncEngine())
  const blink     = useRef(new BlinkPhysics())
  const lastTs    = useRef(null)
  const lastBgSrc = useRef(null)
  const bgImgRef  = useRef(null)

  // Expose canvas to parent for recording
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    resetEngines: () => {
      lipSync.current.reset()
      blink.current.reset()
    },
  }))

  // Load bg image when bgImage prop changes (could be File or URL)
  useEffect(() => {
    if (!bgImage) { bgImgRef.current = null; return }
    if (bgImage === lastBgSrc.current) return
    lastBgSrc.current = bgImage
    const img = new Image()
    img.onload  = () => { bgImgRef.current = img }
    img.onerror = () => { bgImgRef.current = null }
    if (typeof bgImage === 'string') {
      img.src = bgImage
    } else {
      img.src = URL.createObjectURL(bgImage)
    }
  }, [bgImage])

  const draw = useCallback((timestamp) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false })
    const dt = lastTs.current != null ? (timestamp - lastTs.current) / 1000 : 0.016
    lastTs.current = timestamp

    // Audio frame → mouth
    const frameData = audioAnalyzer?.isReady
      ? audioAnalyzer.getFrame()
      : { rms: 0, viseme: 'REST', lowEnergy: 0, highEnergy: 0 }

    const mouthParams = lipSync.current.update(frameData)

    // Time for blink physics
    const currentTime = audioAnalyzer?.getCurrentTime?.() ?? (timestamp / 1000)
    const eyeState = blink.current.update(currentTime)

    const cfg = STYLE_CONFIGS[style] || STYLE_CONFIGS.googly

    const fp = facePos || {}
    const cx = CANVAS_W / 2 + (fp.x || 0)
    const cy = CANVAS_H / 2 + (fp.y || 0)
    const faceScale = fp.scale || 1.0

    const gazeOffset = interpolateGaze(gazeMarkers, currentTime)

    renderFrame(ctx, {
      style,
      config: cfg,
      mouthParams,
      eyeState: {
        blinkProgress: eyeState.blinkProgress,
        saccadeOffset: eyeState.saccadeOffset,
      },
      mood,
      cx,
      cy,
      faceScale,
      bgMode:     bgMode || 'transparent',
      bgImage:    bgImgRef.current,
      canvasW:    CANVAS_W,
      canvasH:    CANVAS_H,
      layers,
      gazeOffset,
    })

    // Report playback time
    if (onTimeUpdate && audioAnalyzer?.isReady) {
      onTimeUpdate(audioAnalyzer.getCurrentTime())
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [style, mood, audioAnalyzer, bgMode, facePos, layers, gazeMarkers, onTimeUpdate])

  useEffect(() => {
    lastTs.current = null
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  return (
    <div
      className={`relative overflow-hidden rounded-2xl
        ${bgMode === 'transparent' ? 'bg-checkerboard' : ''}
        ${bgMode === 'greenscreen' ? 'bg-[#00FF00]' : ''}
        ${bgMode === 'composite' ? 'bg-gray-900' : ''}`}
      style={{ aspectRatio: '1/1', width: '100%' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
})

export default CanvasStage
