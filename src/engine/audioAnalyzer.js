// Web Audio API analyzer — extracts RMS amplitude and FFT frequency bands per frame

export class AudioAnalyzer {
  constructor() {
    this.context = null
    this.analyser = null
    this.source = null
    this.dataArray = null
    this.bufferLength = 0
    this.isReady = false
  }

  async loadFile(file) {
    if (this.context) {
      await this.context.close()
    }
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 1024
    this.analyser.smoothingTimeConstant = 0.65

    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer)

    this.audioBuffer = audioBuffer
    this.bufferLength = this.analyser.frequencyBinCount
    this.dataArray = new Uint8Array(this.bufferLength)
    this.isReady = true

    return audioBuffer.duration
  }

  play(onEnd) {
    if (!this.isReady || !this.context) return null
    if (this.source) {
      try { this.source.stop() } catch {}
    }
    this.source = this.context.createBufferSource()
    this.source.buffer = this.audioBuffer
    this.source.connect(this.analyser)
    this.analyser.connect(this.context.destination)
    if (onEnd) this.source.onended = onEnd
    this.source.start(0)
    this.startTime = this.context.currentTime
    return this.source
  }

  pause() {
    if (this.context && this.context.state === 'running') {
      this.context.suspend()
    }
  }

  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume()
    }
  }

  stop() {
    if (this.source) {
      try { this.source.stop() } catch {}
    }
  }

  getCurrentTime() {
    if (!this.context || !this.startTime) return 0
    return this.context.currentTime - this.startTime
  }

  // Returns { rms: 0–1, viseme: string, lowEnergy: 0–1, highEnergy: 0–1 }
  getFrame() {
    if (!this.analyser || !this.dataArray) {
      return { rms: 0, viseme: 'REST', lowEnergy: 0, highEnergy: 0 }
    }

    this.analyser.getByteFrequencyData(this.dataArray)
    const sampleRate = this.context.sampleRate
    const binSize = sampleRate / this.analyser.fftSize

    // RMS across full spectrum
    let sum = 0
    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 255
      sum += v * v
    }
    const rms = Math.min(1, Math.sqrt(sum / this.bufferLength) * 3.5)

    // Low-mid: 150–800 Hz (OO/OH vowels)
    const lowStart = Math.floor(150 / binSize)
    const lowEnd = Math.floor(800 / binSize)
    let lowSum = 0
    for (let i = lowStart; i < lowEnd && i < this.bufferLength; i++) {
      lowSum += this.dataArray[i] / 255
    }
    const lowEnergy = Math.min(1, lowSum / (lowEnd - lowStart) * 4)

    // High-mid: 2000–5000 Hz (EE/fricatives)
    const highStart = Math.floor(2000 / binSize)
    const highEnd = Math.floor(5000 / binSize)
    let highSum = 0
    for (let i = highStart; i < highEnd && i < this.bufferLength; i++) {
      highSum += this.dataArray[i] / 255
    }
    const highEnergy = Math.min(1, highSum / (highEnd - highStart) * 6)

    // Noise gate
    if (rms < 0.04) {
      return { rms: 0, viseme: 'REST', lowEnergy: 0, highEnergy: 0 }
    }

    // Viseme detection
    let viseme = 'AA'
    if (highEnergy > 0.45) {
      viseme = 'EE'
    } else if (lowEnergy > 0.5) {
      viseme = 'OO'
    } else if (rms > 0.5) {
      viseme = 'AA'
    } else {
      viseme = 'AA'
    }

    return { rms, viseme, lowEnergy, highEnergy }
  }

  // Pre-render all frames for deterministic offline export
  async extractFrameData(fps = 30) {
    if (!this.audioBuffer) return []
    const duration = this.audioBuffer.duration
    const totalFrames = Math.ceil(duration * fps)
    const offlineCtx = new OfflineAudioContext(
      this.audioBuffer.numberOfChannels,
      Math.ceil(duration * this.audioBuffer.sampleRate),
      this.audioBuffer.sampleRate
    )
    const src = offlineCtx.createBufferSource()
    src.buffer = this.audioBuffer

    // Create offline analyser
    const scriptProc = offlineCtx.createScriptProcessor(512, 1, 1)
    const frameDataArray = []
    let frameIndex = 0

    src.connect(scriptProc)
    scriptProc.connect(offlineCtx.destination)
    src.start(0)

    const renderedBuffer = await offlineCtx.startRendering()

    // Post-process: extract RMS per frame from the rendered PCM
    const sampleRate = renderedBuffer.sampleRate
    const channel = renderedBuffer.getChannelData(0)
    const samplesPerFrame = Math.floor(sampleRate / fps)

    for (let f = 0; f < totalFrames; f++) {
      const start = f * samplesPerFrame
      const end = Math.min(start + samplesPerFrame, channel.length)
      let sum = 0
      for (let i = start; i < end; i++) {
        sum += channel[i] * channel[i]
      }
      const rms = Math.sqrt(sum / (end - start))
      frameDataArray.push({ rms: Math.min(1, rms * 6) })
    }

    return frameDataArray
  }

  destroy() {
    this.stop()
    if (this.context) {
      this.context.close()
      this.context = null
    }
  }
}
