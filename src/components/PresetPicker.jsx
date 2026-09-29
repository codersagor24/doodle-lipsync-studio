import { FACE_PRESETS, MOODS } from '../presets/facePresets'

export default function PresetPicker({ style, mood, onStyleChange, onMoodChange }) {
  return (
    <div className="space-y-4">
      {/* Face Style */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Face Style</h3>
        <div className="space-y-1.5">
          {FACE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onStyleChange(preset.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                ${style === preset.id
                  ? 'bg-purple-700/60 border border-purple-500/70 text-white'
                  : 'bg-gray-800/60 border border-transparent text-gray-300 hover:bg-gray-700/60 hover:text-white'
                }`}
            >
              <span className="text-xl">{preset.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{preset.name}</p>
                <p className="text-xs text-gray-500 leading-tight truncate mt-0.5">{preset.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mood / Expression */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Mood</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => onMoodChange(m.id)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all
                ${mood === m.id
                  ? 'bg-purple-700/60 border border-purple-500/70'
                  : 'bg-gray-800/60 border border-transparent hover:bg-gray-700/60'
                }`}
            >
              <span className="text-lg">{m.icon}</span>
              <span className="text-xs text-gray-400 leading-none text-center">
                {m.id.charAt(0).toUpperCase() + m.id.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
