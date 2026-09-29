import { useState } from 'react'
import { X, Download, Film, Layers, Image } from 'lucide-react'
import { Recorder } from '../engine/recorder'

const EXPORT_MODES = [
  {
    id: 'greenscreen',
    icon: <Film size={20} />,
    title: 'Green Screen',
    subtitle: 'Chroma-key #00FF00 — CapCut / Premiere / DaVinci',
    color: '#22c55e',
  },
  {
    id: 'transparent',
    icon: <Layers size={20} />,
    title: 'Transparent Alpha',
    subtitle: 'WebM VP9 with alpha channel — drag & drop in Premiere',
    color: '#a78bfa',
  },
  {
    id: 'composite',
    icon: <Image size={20} />,
    title: 'Composite (BG + Face)',
    subtitle: 'Export the full composite with your background image',
    color: '#f59e0b',
  },
]

export default function ExportModal({
  onClose,
  canvasRef,
  audioAnalyzer,
  exportBgMode,
  onBgModeChange,
  duration,
}) {
  const [fps, setFps] = useState(30)
  const [status, setStatus] = useState('idle')  // idle | recording | done | error
  const [progress, setProgress] = useState(0)
  const [mimeType, setMimeType] = useState('')

  const recorderRef = { current: null }

  const handleExport = async () => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return

    setStatus('recording')
    setProgress(0)

    const recorder = new Recorder()
    recorderRef.current = recorder
    const mime = recorder.start(canvas, fps, exportBgMode)
    setMimeType(mime)

    // Play audio for the recording duration
    let ended = false
    audioAnalyzer?.play(() => { ended = true })

    // Track progress
    const totalMs = duration * 1000
    const startMs = Date.now()
    const tick = setInterval(() => {
      const elapsed = Date.now() - startMs
      setProgress(Math.min(1, elapsed / totalMs))
      if (ended || elapsed >= totalMs + 500) {
        clearInterval(tick)
        doStop()
      }
    }, 250)

    const doStop = async () => {
      clearInterval(tick)
      setProgress(1)
      const result = await recorder.stop()
      if (result?.blob) {
        const ext = Recorder.getExtension(result.mimeType)
        const filename = `doodle-lipsync-${exportBgMode}-${fps}fps.${ext}`
        Recorder.downloadBlob(result.blob, filename)
        setStatus('done')
      } else {
        setStatus('error')
      }
    }
  }

  const handleCancel = async () => {
    if (recorderRef.current) await recorderRef.current.stop()
    setStatus('idle')
    audioAnalyzer?.stop()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Download size={18} className="text-purple-400" />
            <h2 className="font-semibold text-white">Export Video</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Export mode */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Output Format</p>
            {EXPORT_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onBgModeChange(mode.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                  ${exportBgMode === mode.id
                    ? 'border-purple-500/70 bg-purple-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'}`}
              >
                <div style={{ color: mode.color }}>{mode.icon}</div>
                <div>
                  <p className="text-sm font-medium text-white">{mode.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{mode.subtitle}</p>
                </div>
                {exportBgMode === mode.id && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-purple-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* FPS */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Frame Rate</p>
            <div className="flex gap-2">
              {[24, 30, 60].map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all
                    ${fps === f
                      ? 'bg-purple-700 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                >
                  {f} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-800/60 rounded-xl p-3 text-xs text-gray-400 space-y-1">
            <p>• Duration: <span className="text-white">{duration.toFixed(1)}s</span></p>
            <p>• Resolution: <span className="text-white">1080 × 1080</span></p>
            <p>• Codec: <span className="text-white">{mimeType || 'auto-select'}</span></p>
            {exportBgMode === 'transparent' && (
              <p className="text-yellow-400">⚠ Alpha requires Chrome / Edge (VP9)</p>
            )}
          </div>

          {/* Progress */}
          {status === 'recording' && (
            <div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 text-center">
                Recording… {Math.round(progress * 100)}%
              </p>
            </div>
          )}

          {status === 'done' && (
            <p className="text-sm text-green-400 text-center">Download started!</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {status === 'idle' || status === 'done' || status === 'error' ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={!audioAnalyzer?.isReady || duration <= 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                    bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed
                    text-sm font-semibold transition-colors"
                >
                  <Download size={15} />
                  Render & Export
                </button>
              </>
            ) : (
              <button
                onClick={handleCancel}
                className="w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-sm transition-colors"
              >
                Cancel Recording
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
