// Canvas-to-video recorder using MediaRecorder + captureStream

export class Recorder {
  constructor() {
    this.mediaRecorder = null
    this.chunks = []
    this.isRecording = false
  }

  // Preferred MIME types in order of preference
  static getSupportedMimeType(wantAlpha) {
    const candidates = wantAlpha
      ? ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
    return candidates.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm'
  }

  /**
   * Start recording a canvas at the given FPS.
   * @param {HTMLCanvasElement} canvas
   * @param {number} fps  30 or 60
   * @param {string} bgMode  'greenscreen' | 'transparent' | 'composite'
   */
  start(canvas, fps = 30, bgMode = 'greenscreen') {
    if (this.isRecording) this.stop()

    const wantAlpha = bgMode === 'transparent'
    const mimeType = Recorder.getSupportedMimeType(wantAlpha)

    const stream = canvas.captureStream(fps)
    this.chunks = []

    const options = {
      mimeType,
      videoBitsPerSecond: 8_000_000,  // 8 Mbps — good quality
    }

    this.mediaRecorder = new MediaRecorder(stream, options)
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data)
    }
    this.mediaRecorder.start(100)  // collect in 100ms chunks
    this.isRecording = true

    return mimeType
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null)
        return
      }
      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType
        const blob = new Blob(this.chunks, { type: mimeType })
        this.isRecording = false
        resolve({ blob, mimeType })
      }
      this.mediaRecorder.stop()
    })
  }

  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  static getExtension(mimeType) {
    if (mimeType.includes('webm')) return 'webm'
    if (mimeType.includes('mp4'))  return 'mp4'
    return 'webm'
  }
}
