import { useRef, useState, useEffect } from 'react'
import { Upload, Play, Pause, Square, Music } from 'lucide-react'

export default function AudioControls({ audioAnalyzer, onFileLoaded, isPlaying, onPlay, onPause, onStop, duration, currentTime }) {
  const fileInputRef = useRef(null)
  const waveCanvasRef = useRef(null)
  const [fileName, setFileName] = useState(null)
  const [waveData, setWaveData] = useState(null)

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('audio/')) return
    setFileName(file.name)

    const dur = await audioAnalyzer.loadFile(file)
    // Build waveform for display
    const arrayBuffer = await file.arrayBuffer()
    const ac = new AudioContext()
    const buf = await ac.decodeAudioData(arrayBuffer)
    await ac.close()

    const data = buf.getChannelData(0)
    const samples = 200
    const blockSize = Math.floor(data.length / samples)
    const wave = []
    for (let i = 0; i < samples; i++) {
      let sum = 0
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(data[i * blockSize + j])
      }
      wave.push(sum / blockSize)
    }
    const max = Math.max(...wave, 0.001)
    setWaveData(wave.map(v => v / max))

    onFileLoaded(dur)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // Draw waveform
  useEffect(() => {
    const canvas = waveCanvasRef.current
    if (!canvas || !waveData) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const progress = duration > 0 ? currentTime / duration : 0
    const progX = progress * w

    waveData.forEach((v, i) => {
      const x = (i / waveData.length) * w
      const barH = v * h * 0.8
      const y = (h - barH) / 2
      ctx.fillStyle = x < progX ? '#a78bfa' : '#4b5563'
      ctx.fillRect(x, y, Math.max(1, w / waveData.length - 1), barH)
    })

    // Playhead
    if (duration > 0) {
      ctx.fillStyle = '#f0abfc'
      ctx.fillRect(progX - 1, 0, 2, h)
    }
  }, [waveData, currentTime, duration])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Audio</h3>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-600 rounded-xl p-4 text-center cursor-pointer
          hover:border-purple-500 hover:bg-purple-900/10 transition-all"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {fileName ? (
          <div className="flex items-center justify-center gap-2 text-purple-300">
            <Music size={16} />
            <span className="text-sm truncate max-w-[160px]">{fileName}</span>
          </div>
        ) : (
          <>
            <Upload size={20} className="mx-auto mb-1 text-gray-500" />
            <p className="text-xs text-gray-500">Drop audio file here</p>
            <p className="text-xs text-gray-600 mt-0.5">MP3, WAV, OGG, M4A</p>
          </>
        )}
      </div>

      {/* Waveform */}
      {waveData && (
        <canvas
          ref={waveCanvasRef}
          width={280}
          height={52}
          className="w-full rounded-lg bg-gray-900"
        />
      )}

      {/* Time display */}
      {duration > 0 && (
        <div className="flex justify-between text-xs text-gray-500 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}

      {/* Transport */}
      <div className="flex gap-2">
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!audioAnalyzer?.isReady}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg
            bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed
            text-sm font-medium transition-colors"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={onStop}
          disabled={!audioAnalyzer?.isReady}
          className="py-2 px-3 rounded-lg bg-gray-700 hover:bg-gray-600
            disabled:cursor-not-allowed text-sm transition-colors"
        >
          <Square size={15} />
        </button>
      </div>
    </div>
  )
}
