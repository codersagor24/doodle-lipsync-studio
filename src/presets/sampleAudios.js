/**
 * Sample Audio Generator & Demo Voices for Doodle Lip-Sync Studio
 * Synthesizes realistic animated dialogue audio directly in the browser
 * with pitch inflection, formant harmonics, and realistic speech pauses.
 * Works completely offline without needing external audio downloads!
 */

export function createSynthesizedSpeechBlob(scriptType = 'cucumber_story') {
  const sampleRate = 44100;
  let duration = 6.0; // 6 seconds demo

  // Syllable definition: { time, duration, pitch, vowel (f1, f2), volume }
  let syllables = [];

  if (scriptType === 'cucumber_story') {
    // "শুনছো ভাই গাছ! আমাকে তো কৃষকে কেটে নিয়ে যাবে!" (Cucumber talking to tree)
    duration = 5.5;
    syllables = [
      { start: 0.2, dur: 0.22, freq: 220, type: 'OO', amp: 0.8 },
      { start: 0.45, dur: 0.25, freq: 240, type: 'EE', amp: 0.85 },
      { start: 0.75, dur: 0.35, freq: 260, type: 'AA', amp: 0.95 },
      // Pause
      { start: 1.3, dur: 0.28, freq: 230, type: 'AA', amp: 0.8 },
      { start: 1.6, dur: 0.22, freq: 210, type: 'EE', amp: 0.75 },
      { start: 1.85, dur: 0.4, freq: 250, type: 'OO', amp: 0.9 },
      // Excited phrase
      { start: 2.6, dur: 0.2, freq: 280, type: 'EE', amp: 0.9 },
      { start: 2.85, dur: 0.25, freq: 300, type: 'AA', amp: 1.0 },
      { start: 3.15, dur: 0.3, freq: 320, type: 'AA', amp: 0.95 },
      { start: 3.5, dur: 0.4, freq: 260, type: 'OO', amp: 0.85 },
      // Ending
      { start: 4.2, dur: 0.25, freq: 230, type: 'AA', amp: 0.7 },
      { start: 4.5, dur: 0.45, freq: 190, type: 'EE', amp: 0.6 },
    ];
  } else if (scriptType === 'excited_chibi') {
    // High-energy fast kawaii dialogue
    duration = 4.2;
    syllables = [
      { start: 0.1, dur: 0.18, freq: 380, type: 'EE', amp: 0.9 },
      { start: 0.3, dur: 0.18, freq: 420, type: 'AA', amp: 0.95 },
      { start: 0.5, dur: 0.25, freq: 460, type: 'OO', amp: 1.0 },
      // Quick jump
      { start: 1.0, dur: 0.15, freq: 410, type: 'EE', amp: 0.85 },
      { start: 1.18, dur: 0.15, freq: 440, type: 'EE', amp: 0.9 },
      { start: 1.35, dur: 0.22, freq: 480, type: 'AA', amp: 1.0 },
      // Climax
      { start: 2.0, dur: 0.3, freq: 520, type: 'AA', amp: 1.0 },
      { start: 2.35, dur: 0.4, freq: 360, type: 'OO', amp: 0.85 },
      { start: 3.0, dur: 0.4, freq: 320, type: 'EE', amp: 0.7 },
    ];
  } else {
    // Dramatic comic speech
    duration = 6.2;
    syllables = [
      { start: 0.2, dur: 0.4, freq: 160, type: 'OO', amp: 0.8 },
      { start: 0.7, dur: 0.35, freq: 175, type: 'AA', amp: 0.85 },
      // Big gasp
      { start: 1.5, dur: 0.5, freq: 240, type: 'AA', amp: 1.0 },
      // Rapid anger
      { start: 2.3, dur: 0.18, freq: 210, type: 'EE', amp: 0.9 },
      { start: 2.5, dur: 0.18, freq: 220, type: 'EE', amp: 0.9 },
      { start: 2.7, dur: 0.25, freq: 200, type: 'AA', amp: 0.95 },
      // Outro
      { start: 3.5, dur: 0.6, freq: 180, type: 'OO', amp: 0.85 },
      { start: 4.4, dur: 0.7, freq: 140, type: 'AA', amp: 0.6 },
    ];
  }

  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);

  syllables.forEach(s => {
    const startIndex = Math.floor(s.start * sampleRate);
    const length = Math.floor(s.dur * sampleRate);

    // Formant frequency definitions
    let f1 = 700, f2 = 1200; // default AA
    if (s.type === 'OO') { f1 = 350; f2 = 800; }
    if (s.type === 'EE') { f1 = 280; f2 = 2300; }

    for (let i = 0; i < length && (startIndex + i) < numSamples; i++) {
      const t = i / sampleRate;
      const progress = i / length;

      // Envelope (attack, decay, release)
      let env = 1.0;
      if (progress < 0.15) env = progress / 0.15;
      else if (progress > 0.8) env = (1.0 - progress) / 0.2;

      // Pitch vibrato & fundamental carrier
      const pitchMod = Math.sin(2 * Math.PI * 5 * t) * 4;
      const baseFreq = s.freq + pitchMod;
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t);

      // Formants
      const formant1 = Math.sin(2 * Math.PI * f1 * t) * 0.45;
      const formant2 = Math.sin(2 * Math.PI * f2 * t) * 0.3;

      // Combine harmonics
      const sample = (fundamental * 0.5 + formant1 + formant2) * env * s.amp * 0.45;
      buffer[startIndex + i] += sample;
    }
  });

  // Convert Float32Array to 16-bit PCM WAV Blob
  return createWavBlob(buffer, sampleRate);
}

function createWavBlob(float32Array, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = float32Array.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write WAV Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const SAMPLE_AUDIO_PRESETS = [
  { id: 'cucumber_story', name: '🥒 শসা ও গাছ সংলাপ (Cucumber Dialogue)', desc: 'প্রাকৃতিক ডুডল ভয়েস ডেমো' },
  { id: 'excited_chibi', name: '✨ কাওয়াই চিয়ারফুল স্পিচ (Kawaii Cute Voice)', desc: 'উচ্চ পিচ ও দ্রুত কথা' },
  { id: 'comic_drama', name: '🎭 কমিক ড্রামা ও চিৎকার (Comic Scream & Talk)', desc: 'ড্রামাটিক ওঠানামা ও বিস্ময়' },
];
