import React from 'react';
import { MOODS } from '../presets/facePresets';
import { Smile, Plus, Trash2, Clock } from 'lucide-react';

export function TimelineMoods({
  currentMood,
  setCurrentMood,
  moodTimeline,
  setMoodTimeline,
  currentTime,
}) {
  // Add a mood change marker at current audio time
  const addMoodKeyframe = (moodId) => {
    setCurrentMood(moodId);
    setMoodTimeline((prev) => {
      // Remove any existing marker within 0.1s to avoid duplicates
      const filtered = prev.filter((m) => Math.abs(m.time - currentTime) > 0.15);
      const updated = [...filtered, { time: Math.round(currentTime * 10) / 10, mood: moodId }];
      return updated.sort((a, b) => a.time - b.time);
    });
  };

  const removeKeyframe = (index) => {
    setMoodTimeline((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-studio-surface border-t border-studio-border px-6 py-3 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        {/* Mood Selector Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mr-1">
            <Smile className="w-3.5 h-3.5 text-emerald-400" />
            <span>মুড ও এক্সপ্রেশন:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {MOODS.map((m) => {
              const isActive = currentMood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => addMoodKeyframe(m.id)}
                  title={`${m.name} (টাইমলাইনে যুক্ত করতে ক্লিক করুন)`}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium flex items-center gap-1.5 transition-all active:scale-95 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-studio-card text-slate-400 border-studio-border hover:text-white hover:border-slate-600'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Keyframe Badges */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-md">
          {moodTimeline.length > 0 ? (
            moodTimeline.map((item, idx) => {
              const moodDef = MOODS.find((m) => m.id === item.mood);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-studio-card border border-studio-border text-[11px] text-slate-300 shrink-0"
                >
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{item.time.toFixed(1)}s:</span>
                  <span>{moodDef?.icon}</span>
                  <button
                    onClick={() => removeKeyframe(idx)}
                    className="text-slate-500 hover:text-rose-400 ml-0.5"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <span className="text-[11px] text-slate-500">
              (যেকোনো মুহূর্তে মুড বদলাতে বাটন চাপলে টাইমলাইনে অটো মার্কার যুক্ত হবে)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
