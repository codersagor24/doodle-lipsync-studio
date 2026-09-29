import { useRef, useEffect, useCallback } from 'react'
import { MOOD_CONFIGS } from '../presets/facePresets'

// Each marker: { time, mood }
export default function Timeline({ duration, currentTime, markers, onMarkersChange, onSeek }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // Track BG
    ctx.fillStyle = '#1e1e2e'
    ctx.beginPath()
    ctx.roundRect(0, h / 2 - 6, w, 12, 6)
    ctx.fill()

    if (duration <= 0) return

    // Colored segments per marker
    const sorted = [...markers].sort((a, b) => a.time - b.time)
    const segments = []
    for (let i = 0; i < sorted.length; i++) {
      segments.push({
        start: sorted[i].time,
        end:   sorted[i + 1]?.time ?? duration,
        mood:  sorted[i].mood,
      })
    }
    for (const seg of segments) {
      const cfg = MOOD_CONFIGS[seg.mood]
      if (!cfg) continue
      const x1 = (seg.start / duration) * w
      const x2 = (seg.end   / duration) * w
      ctx.fillStyle = cfg.color + '55'
      ctx.fillRect(x1, h / 2 - 6, x2 - x1, 12)
    }

    // Progress fill
    const progX = (currentTime / duration) * w
    ctx.fillStyle = '#7c3aed88'
    ctx.beginPath()
    ctx.roundRect(0, h / 2 - 6, progX, 12, 6)
    ctx.fill()

    // Mood markers
    for (const m of sorted) {
      const x = (m.time / duration) * w
      const cfg = MOOD_CONFIGS[m.mood]
      ctx.fillStyle = cfg?.color ?? '#fff'
      ctx.beginPath()
      ctx.arc(x, h / 2, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(cfg?.emoji ?? '?', x, h / 2 + 3.5)
    }

    // Playhead
    ctx.fillStyle = '#c4b5fd'
    ctx.fillRect(progX - 1.5, 0, 3, h)
    ctx.beginPath()
    ctx.arc(progX, h / 2, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#a78bfa'
    ctx.fill()
  }, [duration, currentTime, markers])

  useEffect(() => { draw() }, [draw])

  const getTimeFromX = (e) => {
    const canvas = canvasRef.current
    if (!canvas || duration <= 0) return 0
    const rect = canvas.getBoundingClientRect()
    return ((e.clientX - rect.left) / rect.width) * duration
  }

  const handleClick = (e) => {
    const t = getTimeFromX(e)
    onSeek?.(t)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    if (duration <= 0 || markers.length === 0) return
    const t = getTimeFromX(e)
    // Remove nearest marker within 2% of duration
    const threshold = duration * 0.02
    const closest = markers.reduce((best, m) =>
      Math.abs(m.time - t) < Math.abs(best.time - t) ? m : best, markers[0])
    if (Math.abs(closest.time - t) < threshold) {
      onMarkersChange(markers.filter(m => m !== closest))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Timeline</h3>
        {duration > 0 && (
          <span className="text-xs text-gray-600">
            Click to seek • Right-click to delete marker
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={40}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="w-full rounded-lg cursor-pointer"
        style={{ height: 40 }}
      />

      {/* Mood stamp buttons */}
      {duration > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(MOOD_CONFIGS).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => {
                const time = currentTime
                const filtered = markers.filter(m => Math.abs(m.time - time) > 0.3)
                onMarkersChange([...filtered, { time, mood: id }])
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
              style={{ borderColor: cfg.color + '55' }}
            >
              <span>{cfg.emoji}</span>
              <span className="text-gray-400">{cfg.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
