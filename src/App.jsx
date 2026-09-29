import { useState, useRef, useCallback, useEffect } from 'react'
import { Download, ImagePlus, X, Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

import CanvasStage from './components/CanvasStage'
import AudioControls from './components/AudioControls'
import PresetPicker from './components/PresetPicker'
import Timeline from './components/Timeline'
import ExportModal from './components/ExportModal'
import { AudioAnalyzer } from './engine/audioAnalyzer'
import { MOOD_CONFIGS } from './presets/facePresets'

const audioAnalyzer = new AudioAnalyzer()

export default function App() {
  const canvasStageRef = useRef(null)

  const [style, setStyle]         = useState('googly')
  const [mood, setMood]           = useState('normal')
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration]   = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [markers, setMarkers]     = useState([])
  const [bgMode, setBgMode]       = useState('transparent')
  const [bgImage, setBgImage]     = useState(null)
  const [facePos, setFacePos]     = useState({ x: 0, y: 0, scale: 1 })
  const [showExport, setShowExport] = useState(false)
  const [layers, setLayers]       = useState({ eyes: true, mouth: true, eyebrows: true, cheeks: true })
  const [gazeMarkers, setGazeMarkers] = useState([])
  const [gazeDir, setGazeDir]     = useState({ x: 0, y: 0 })

  const bgFileRef = useRef(null)

  // Sync mood from timeline markers
  useEffect(() => {
    if (markers.length === 0) return
    const sorted = [...markers].sort((a, b) => a.time - b.time)
    const active = sorted.filter(m => m.time <= currentTime).pop()
    if (active) setMood(active.mood)
  }, [currentTime, markers])

  const handleFileLoaded = useCallback((dur) => {
    setDuration(dur)
    setCurrentTime(0)
    setIsPlaying(false)
    canvasStageRef.current?.resetEngines()
  }, [])

  const handlePlay = () => {
    if (!audioAnalyzer.isReady) return
    audioAnalyzer.play(() => {
      setIsPlaying(false)
      setCurrentTime(duration)
    })
    setIsPlaying(true)
  }

  const handlePause = () => {
    audioAnalyzer.pause()
    setIsPlaying(false)
  }

  const handleStop = () => {
    audioAnalyzer.stop()
    setIsPlaying(false)
    setCurrentTime(0)
    canvasStageRef.current?.resetEngines()
  }

  const handleSeek = (t) => {
    // Restart from seek position — Web Audio API doesn't support seek on running source
    const wasPlaying = isPlaying
    audioAnalyzer.stop()
    setCurrentTime(t)
    if (wasPlaying) handlePlay()
  }

  const handleBgUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setBgImage(url)
    setBgMode('composite')
  }

  const handleBgClear = () => {
    setBgImage(null)
    setBgMode('transparent')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a14] text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800/80 bg-[#0f0f1e]/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-lg">
            🎬
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Doodle Lip-Sync Studio</h1>
            <p className="text-xs text-gray-500 mt-0.5">ডুডল লিপ-সিঙ্ক স্টুডিও</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BG mode switcher */}
          <div className="flex bg-gray-800 rounded-lg p-0.5 gap-0.5 text-xs">
            {[
              { id: 'transparent', label: 'Alpha' },
              { id: 'greenscreen', label: 'Green' },
              { id: 'composite',   label: 'Comp' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setBgMode(m.id)}
                className={`px-2.5 py-1.5 rounded-md transition-all font-medium
                  ${bgMode === m.id ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500
              text-sm font-semibold transition-colors"
          >
            <Download size={15} />
            Export
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Canvas */}
        <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
          {/* Canvas stage */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="w-full max-w-lg">
              <CanvasStage
                ref={canvasStageRef}
                style={style}
                mood={mood}
                audioAnalyzer={audioAnalyzer}
                isPlaying={isPlaying}
                bgMode={bgMode}
                bgImage={bgImage}
                facePos={facePos}
                layers={layers}
                gazeMarkers={gazeDir.x !== 0 || gazeDir.y !== 0
                  ? [{ time: 0, gaze: gazeDir }]
                  : gazeMarkers}
                onTimeUpdate={setCurrentTime}
              />
            </div>
          </div>

          {/* Face position controls */}
          <div className="flex items-center gap-3 bg-gray-900/60 rounded-xl p-3">
            <span className="text-xs text-gray-500 font-medium">Face:</span>
            <div className="flex items-center gap-1.5">
              {[
                { icon: <Move size={13} />, label: '←', action: () => setFacePos(p => ({ ...p, x: p.x - 20 })) },
                { icon: <Move size={13} />, label: '→', action: () => setFacePos(p => ({ ...p, x: p.x + 20 })) },
                { icon: <Move size={13} />, label: '↑', action: () => setFacePos(p => ({ ...p, y: p.y - 20 })) },
                { icon: <Move size={13} />, label: '↓', action: () => setFacePos(p => ({ ...p, y: p.y + 20 })) },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action}
                  className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm flex items-center justify-center transition-colors">
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button onClick={() => setFacePos(p => ({ ...p, scale: Math.max(0.3, p.scale - 0.1) }))}
                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                <ZoomOut size={13} />
              </button>
              <span className="text-xs text-gray-500 w-10 text-center">{(facePos.scale * 100).toFixed(0)}%</span>
              <button onClick={() => setFacePos(p => ({ ...p, scale: Math.min(2.5, p.scale + 0.1) }))}
                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                <ZoomIn size={13} />
              </button>
            </div>
            <button
              onClick={() => setFacePos({ x: 0, y: 0, scale: 1 })}
              className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-gray-900/60 rounded-xl p-3">
            <Timeline
              duration={duration}
              currentTime={currentTime}
              markers={markers}
              onMarkersChange={setMarkers}
              onSeek={handleSeek}
            />
          </div>
        </div>

        {/* Right: Controls panel */}
        <div className="w-72 flex-shrink-0 border-l border-gray-800 overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Audio */}
            <div className="bg-gray-900/50 rounded-xl p-4">
              <AudioControls
                audioAnalyzer={audioAnalyzer}
                onFileLoaded={handleFileLoaded}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
                duration={duration}
                currentTime={currentTime}
              />
            </div>

            {/* Style & Mood */}
            <div className="bg-gray-900/50 rounded-xl p-4">
              <PresetPicker
                style={style}
                mood={mood}
                onStyleChange={setStyle}
                onMoodChange={setMood}
              />
            </div>

            {/* Layer Toggles */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Layers</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'eyes',     label: 'Eyes',   icon: '👁' },
                  { key: 'mouth',    label: 'Mouth',  icon: '👄' },
                  { key: 'eyebrows', label: 'Brows',  icon: '〰' },
                  { key: 'cheeks',   label: 'Cheeks', icon: '🌸' },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setLayers(l => ({ ...l, [key]: !l[key] }))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all
                      ${layers[key]
                        ? 'bg-purple-700/50 border-purple-500/60 text-purple-200'
                        : 'bg-gray-800 border-gray-700 text-gray-500 line-through'}`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gaze Direction */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gaze Direction</h3>
              <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
                {[
                  { label: '↖', x: -0.8, y: -0.8 }, { label: '↑', x: 0, y: -1 }, { label: '↗', x: 0.8, y: -0.8 },
                  { label: '←', x: -1, y: 0 },       { label: '⊙', x: 0, y: 0 }, { label: '→', x: 1, y: 0 },
                  { label: '↙', x: -0.8, y: 0.8 },   { label: '↓', x: 0, y: 1 }, { label: '↘', x: 0.8, y: 0.8 },
                ].map((d) => (
                  <button
                    key={d.label}
                    onClick={() => setGazeDir({ x: d.x, y: d.y })}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all
                      ${gazeDir.x === d.x && gazeDir.y === d.y
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background image */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Background</h3>
              <input
                ref={bgFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBgUpload}
              />
              {bgImage ? (
                <div className="relative">
                  <img src={bgImage} alt="" className="w-full h-24 object-cover rounded-lg" />
                  <button
                    onClick={handleBgClear}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => bgFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                    border-2 border-dashed border-gray-700 hover:border-gray-500
                    text-sm text-gray-500 hover:text-gray-300 transition-all"
                >
                  <ImagePlus size={15} />
                  Upload background image
                </button>
              )}
              <p className="text-xs text-gray-600">Upload your cucumber / tree photo to composite directly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export modal */}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          canvasRef={canvasStageRef}
          audioAnalyzer={audioAnalyzer}
          exportBgMode={bgMode}
          onBgModeChange={setBgMode}
          duration={duration}
        />
      )}
    </div>
  )
}
