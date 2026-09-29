// Converts raw audio frame data into smoothed mouth shape parameters

const ALPHA = 0.35 // exponential smoothing

export class LipSyncEngine {
  constructor() {
    this.smoothedRms = 0
    this.currentViseme = 'REST'
    this.prevViseme = 'REST'
    this.visemeWeight = 0  // blend weight toward currentViseme
    this.smoothedLow = 0
    this.smoothedHigh = 0
  }

  update(frameData) {
    const { rms, viseme, lowEnergy, highEnergy } = frameData

    // Exponential smoothing for organic motion
    this.smoothedRms = ALPHA * rms + (1 - ALPHA) * this.smoothedRms
    this.smoothedLow = ALPHA * lowEnergy + (1 - ALPHA) * this.smoothedLow
    this.smoothedHigh = ALPHA * highEnergy + (1 - ALPHA) * this.smoothedHigh

    // Viseme transition
    if (viseme !== this.currentViseme) {
      this.prevViseme = this.currentViseme
      this.currentViseme = viseme
      this.visemeWeight = 0
    }
    this.visemeWeight = Math.min(1, this.visemeWeight + 0.25)

    return this.getMouthParams()
  }

  getMouthParams() {
    const amplitude = this.smoothedRms
    const isSpeaking = amplitude > 0.04

    // Mouth open height: 0 (closed) to 1 (fully open)
    const openHeight = isSpeaking ? Math.pow(amplitude, 0.7) : 0

    // Horizontal width factor per viseme
    let widthFactor = 1.0
    let roundness = 0  // 0 = flat, 1 = rounded/circular
    let smileAmount = 0

    if (!isSpeaking) {
      widthFactor = 1.0
      roundness = 0
      smileAmount = 0
    } else if (this.currentViseme === 'EE') {
      widthFactor = 1.4
      roundness = 0
      smileAmount = 0.3
    } else if (this.currentViseme === 'OO') {
      widthFactor = 0.7
      roundness = 0.9
      smileAmount = 0
    } else {
      // AA
      widthFactor = 1.1
      roundness = 0.2
      smileAmount = 0
    }

    return {
      openHeight,
      widthFactor,
      roundness,
      smileAmount,
      isSpeaking,
      viseme: this.currentViseme,
      amplitude,
    }
  }

  reset() {
    this.smoothedRms = 0
    this.currentViseme = 'REST'
    this.prevViseme = 'REST'
    this.visemeWeight = 0
    this.smoothedLow = 0
    this.smoothedHigh = 0
  }
}
