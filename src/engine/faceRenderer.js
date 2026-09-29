// Core face drawing engine — pure canvas 2D functions
// All coordinates are in face-local space; caller applies ctx.translate + ctx.scale

// ─── Utility ────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

// ─── Eye Helpers ─────────────────────────────────────────────────────────────

function drawEyelidMask(ctx, w, h, blinkProgress, isCentered) {
  if (blinkProgress <= 0) return
  const lidH = blinkProgress * (h * 2 + 8)
  ctx.fillStyle = 'rgba(10,8,6,0.96)'
  ctx.fillRect(-w - 4, -h - 4, (w + 4) * 2, lidH)
}

// ─── STYLE A: Classic Googly ─────────────────────────────────────────────────

function drawGooglyEye(ctx, cfg, ex, ey, blinkP, sx, sy, mood) {
  const r = cfg.eyeRadius
  const pr = cfg.pupilRadius

  ctx.save()
  ctx.translate(ex, ey)

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 4

  // Sclera
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = cfg.eyeColor
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = cfg.pupilColor
  ctx.lineWidth = cfg.eyeStroke
  ctx.stroke()

  // Pupil + highlight (clipped to sclera)
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, r - 2, 0, Math.PI * 2)
  ctx.clip()

  ctx.beginPath()
  ctx.arc(sx, sy, pr, 0, Math.PI * 2)
  ctx.fillStyle = cfg.pupilColor
  ctx.fill()

  const ho = cfg.highlightOffset
  ctx.beginPath()
  ctx.arc(sx + ho.x, sy + ho.y, cfg.highlightRadius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.fill()

  // Blink mask
  drawEyelidMask(ctx, r, r, blinkP, true)

  ctx.restore()  // clip
  ctx.restore()
}

function drawGooglyFace(ctx, cfg, mouthParams, eyeState, mood, layers, gazeOffset) {
  const { blinkProgress, saccadeOffset } = eyeState
  const gx = (gazeOffset?.x || 0) * 18
  const gy = (gazeOffset?.y || 0) * 10
  const sx = clamp(saccadeOffset.x + gx, -18, 18)
  const sy = clamp(saccadeOffset.y + gy, -10, 10)

  if (layers?.eyes !== false) {
    drawGooglyEye(ctx, cfg, cfg.leftEye.x,  cfg.leftEye.y,  blinkProgress, sx, sy, mood)
    drawGooglyEye(ctx, cfg, cfg.rightEye.x, cfg.rightEye.y, blinkProgress, sx, sy, mood)
  }
  if (layers?.mouth !== false) drawCartoonMouth(ctx, cfg, mouthParams, mood)
}

// ─── STYLE B: Kawaii / Chibi ──────────────────────────────────────────────────

function drawKawaiiEye(ctx, cfg, ex, ey, blinkP, sx, sy, mood) {
  const rw = cfg.eyeWidth / 2
  const rh = cfg.eyeHeight / 2

  ctx.save()
  ctx.translate(ex, ey)

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.2)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 3

  // Sclera (oval)
  ctx.beginPath()
  ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2)
  ctx.fillStyle = cfg.eyeColor
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = '#1a0a1a'
  ctx.lineWidth = cfg.eyeStroke
  ctx.stroke()

  // Inner content clipped to sclera
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(0, 0, rw - 1, rh - 1, 0, 0, Math.PI * 2)
  ctx.clip()

  // Iris gradient
  const grad = ctx.createRadialGradient(sx, sy - 5, 2, sx, sy, cfg.irisRadius)
  grad.addColorStop(0, cfg.irisGradientTop)
  grad.addColorStop(1, cfg.irisGradientBot)
  ctx.beginPath()
  ctx.arc(sx, sy, cfg.irisRadius, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  // Pupil
  ctx.beginPath()
  ctx.arc(sx, sy, cfg.pupilRadius, 0, Math.PI * 2)
  ctx.fillStyle = cfg.pupilColor
  ctx.fill()

  // Primary highlight
  const ho = cfg.highlightOffset
  ctx.beginPath()
  ctx.arc(sx + ho.x, sy + ho.y, cfg.highlightRadius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.97)'
  ctx.fill()

  // Secondary highlight
  const h2 = cfg.highlight2Offset
  ctx.beginPath()
  ctx.arc(sx + h2.x, sy + h2.y, cfg.highlight2Radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fill()

  // Blink mask
  drawEyelidMask(ctx, rw, rh, blinkP, true)

  ctx.restore()  // clip

  // Upper lash line
  ctx.beginPath()
  ctx.moveTo(-rw, 0)
  ctx.quadraticCurveTo(0, -rh - 8, rw, 0)
  ctx.strokeStyle = '#1a0a1a'
  ctx.lineWidth = cfg.eyeStroke + 1.5
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.restore()
}

function drawKawaiiBlush(ctx, cfg) {
  if (!cfg.cheeksEnabled) return
  ctx.save()
  ctx.globalAlpha = 0.7
  for (const pos of [cfg.blushLeft, cfg.blushRight]) {
    ctx.beginPath()
    ctx.ellipse(pos.x, pos.y, cfg.blushRx, cfg.blushRy, 0, 0, Math.PI * 2)
    ctx.fillStyle = cfg.blushColor
    ctx.fill()
  }
  ctx.restore()
}

function drawKawaiiMouth(ctx, cfg, params) {
  const { openHeight, widthFactor, isSpeaking, smileAmount } = params
  const mw = cfg.mouthWidth * widthFactor

  ctx.save()
  ctx.translate(cfg.mouthCenter.x, cfg.mouthCenter.y)
  ctx.strokeStyle = cfg.mouthColor
  ctx.lineWidth = cfg.strokeWidth + 0.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (!isSpeaking || openHeight < 0.05) {
    // Cute rest: small w-curve
    ctx.beginPath()
    ctx.moveTo(-mw * 0.5, 0)
    ctx.quadraticCurveTo(-mw * 0.25, 12, 0, 6)
    ctx.quadraticCurveTo(mw * 0.25, 0, mw * 0.5, -4)
    ctx.stroke()
  } else {
    const mh = openHeight * 42
    // Fill
    ctx.beginPath()
    ctx.ellipse(0, mh * 0.1, mw * 0.5, mh * 0.55, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#3a0a18'
    ctx.fill()

    if (openHeight > 0.25) {
      // Teeth
      ctx.beginPath()
      ctx.ellipse(0, -mh * 0.2, mw * 0.45, mh * 0.25, 0, 0, Math.PI)
      ctx.fillStyle = cfg.teethColor
      ctx.fill()
    }

    ctx.beginPath()
    ctx.ellipse(0, mh * 0.1, mw * 0.5, mh * 0.55, 0, 0, Math.PI * 2)
    ctx.strokeStyle = cfg.mouthColor
    ctx.lineWidth = cfg.strokeWidth
    ctx.stroke()
  }

  ctx.restore()
}

function drawKawaiiiFace(ctx, cfg, mouthParams, eyeState, mood, layers, gazeOffset) {
  const { blinkProgress, saccadeOffset } = eyeState
  const gx = (gazeOffset?.x || 0) * 14
  const gy = (gazeOffset?.y || 0) * 8
  const sx = clamp(saccadeOffset.x + gx, -14, 14)
  const sy = clamp(saccadeOffset.y + gy, -8, 8)

  if (layers?.cheeks !== false) drawKawaiiBlush(ctx, cfg)
  if (layers?.eyes !== false) {
    drawKawaiiEye(ctx, cfg, cfg.leftEye.x,  cfg.leftEye.y,  blinkProgress, sx, sy, mood)
    drawKawaiiEye(ctx, cfg, cfg.rightEye.x, cfg.rightEye.y, blinkProgress, sx, sy, mood)
  }
  if (layers?.mouth !== false) drawKawaiiMouth(ctx, cfg, mouthParams)
}

// ─── STYLE C: Retro Comic ────────────────────────────────────────────────────

function drawComicEyebrow(ctx, cfg, ex, ey, mood, side) {
  // side: -1 = left eye, +1 = right eye
  const len = cfg.eyebrowLength
  const half = len / 2

  const startX = -half, endX = half
  let controlY = -12
  let outerY = 0, innerY = 0

  switch (mood) {
    case 'angry':
      outerY = -6; innerY = 14; controlY = 3; break   // V shape pointing down
    case 'sad':
      outerY = 12; innerY = -8; controlY = -5; break  // inverted V
    case 'shocked':
      outerY = -18; innerY = -16; controlY = -24; break
    case 'happy':
      outerY = 2; innerY = 6; controlY = -16; break
    default:
      outerY = 0; innerY = 0
  }

  const startY = side < 0 ? outerY : innerY
  const endY   = side < 0 ? innerY : outerY

  ctx.save()
  ctx.translate(ex, ey)
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.quadraticCurveTo(0, controlY, endX, endY)
  ctx.strokeStyle = cfg.eyebrowColor
  ctx.lineWidth = cfg.eyebrowThickness
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}

function drawComicEye(ctx, cfg, ex, ey, blinkP, sx, sy, mood) {
  const rw = cfg.eyeWidth / 2
  const rh = cfg.eyeHeight / 2

  ctx.save()
  ctx.translate(ex, ey)

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 3

  // Sclera oval
  ctx.beginPath()
  ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2)
  ctx.fillStyle = cfg.eyeColor
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = cfg.pupilColor
  ctx.lineWidth = cfg.eyeStroke
  ctx.stroke()

  // Inner (clipped)
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(0, 0, rw - 1, rh - 1, 0, 0, Math.PI * 2)
  ctx.clip()

  // Pupil
  ctx.beginPath()
  ctx.arc(sx, sy, cfg.pupilRadius, 0, Math.PI * 2)
  ctx.fillStyle = cfg.pupilColor
  ctx.fill()

  // Highlight
  const ho = cfg.highlightOffset
  ctx.beginPath()
  ctx.arc(sx + ho.x, sy + ho.y, cfg.highlightRadius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.fill()

  // Blink mask
  drawEyelidMask(ctx, rw, rh, blinkP, true)

  ctx.restore()
  ctx.restore()
}

function drawComicFace(ctx, cfg, mouthParams, eyeState, mood, layers, gazeOffset) {
  const { blinkProgress, saccadeOffset } = eyeState
  const gx = (gazeOffset?.x || 0) * 16
  const gy = (gazeOffset?.y || 0) * 9
  const sx = clamp(saccadeOffset.x + gx, -16, 16)
  const sy = clamp(saccadeOffset.y + gy, -9, 9)

  if (cfg.eyebrowEnabled && layers?.eyebrows !== false) {
    drawComicEyebrow(ctx, cfg, cfg.eyebrowLeft.x,  cfg.eyebrowLeft.y,  mood, -1)
    drawComicEyebrow(ctx, cfg, cfg.eyebrowRight.x, cfg.eyebrowRight.y, mood,  1)
  }

  if (layers?.eyes !== false) {
    drawComicEye(ctx, cfg, cfg.leftEye.x,  cfg.leftEye.y,  blinkProgress, sx, sy, mood)
    drawComicEye(ctx, cfg, cfg.rightEye.x, cfg.rightEye.y, blinkProgress, sx, sy, mood)
  }
  if (layers?.mouth !== false) drawComicMouth(ctx, cfg, mouthParams, mood)
}

function drawComicMouth(ctx, cfg, params, mood) {
  const { openHeight, widthFactor, roundness, isSpeaking } = params
  const mw = cfg.mouthWidth * widthFactor
  const halfW = mw * 0.5

  ctx.save()
  ctx.translate(cfg.mouthCenter.x, cfg.mouthCenter.y)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (!isSpeaking || openHeight < 0.04) {
    // Resting face per mood
    ctx.beginPath()
    if (mood === 'angry' || mood === 'sad') {
      ctx.moveTo(-halfW * 0.6, 10)
      ctx.quadraticCurveTo(0, -8, halfW * 0.6, 10)
    } else if (mood === 'happy') {
      ctx.moveTo(-halfW * 0.6, 0)
      ctx.quadraticCurveTo(0, 22, halfW * 0.6, 0)
    } else {
      ctx.moveTo(-halfW * 0.5, 4)
      ctx.quadraticCurveTo(0, 14, halfW * 0.5, 4)
    }
    ctx.strokeStyle = cfg.mouthColor
    ctx.lineWidth = cfg.strokeWidth
    ctx.stroke()
  } else {
    const mh = openHeight * 90
    const topY = -mh * 0.3
    const botY =  mh * 0.7

    // OO shape
    if (roundness > 0.55) {
      const oor = mh * 0.38
      ctx.beginPath()
      ctx.ellipse(0, 0, oor * 0.65, oor, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#1a0506'
      ctx.fill()
      ctx.strokeStyle = cfg.mouthColor
      ctx.lineWidth = cfg.strokeWidth
      ctx.stroke()
    } else {
      // Wide open AA/EE
      // Gums background
      ctx.beginPath()
      ctx.moveTo(-halfW, topY)
      ctx.quadraticCurveTo(0, topY - 20, halfW, topY)
      ctx.quadraticCurveTo(halfW + 18, botY * 0.3, halfW, botY)
      ctx.quadraticCurveTo(0, botY + 20, -halfW, botY)
      ctx.quadraticCurveTo(-halfW - 18, botY * 0.3, -halfW, topY)
      ctx.fillStyle = cfg.gumColor || '#ff99aa'
      ctx.fill()

      // Dark throat
      const throatY = topY + mh * 0.38
      ctx.beginPath()
      ctx.ellipse(0, throatY, halfW * 0.7, mh * 0.35, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#1a0506'
      ctx.fill()

      // Top teeth
      if (openHeight > 0.18) {
        const teethH = clamp(openHeight * 30, 8, 28)
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(-halfW, topY)
        ctx.quadraticCurveTo(0, topY - 20, halfW, topY)
        ctx.lineTo(halfW, topY + teethH)
        ctx.lineTo(-halfW, topY + teethH)
        ctx.closePath()
        ctx.clip()
        // Tooth fill
        ctx.fillStyle = cfg.teethColor
        ctx.fill()
        // Tooth dividers
        const n = 5
        for (let i = 1; i < n; i++) {
          const tx = -halfW + (mw / n) * i
          ctx.beginPath()
          ctx.moveTo(tx, topY - 2)
          ctx.lineTo(tx, topY + teethH)
          ctx.strokeStyle = 'rgba(0,0,0,0.15)'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
        ctx.restore()
      }

      // Bottom teeth
      if (openHeight > 0.35) {
        const bTeethH = clamp(openHeight * 18, 6, 18)
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(-halfW * 0.75, botY)
        ctx.quadraticCurveTo(0, botY + 16, halfW * 0.75, botY)
        ctx.lineTo(halfW * 0.75, botY - bTeethH)
        ctx.lineTo(-halfW * 0.75, botY - bTeethH)
        ctx.closePath()
        ctx.clip()
        ctx.fillStyle = cfg.teethColor
        ctx.fill()
        ctx.restore()
      }

      // Tongue
      if (openHeight > 0.5) {
        const tongueW = halfW * 0.55
        const tongueY = botY - 12
        ctx.beginPath()
        ctx.ellipse(0, tongueY, tongueW, 18, 0, 0, Math.PI * 2)
        ctx.fillStyle = cfg.tongueColor
        ctx.fill()
        // Tongue split line
        ctx.beginPath()
        ctx.moveTo(0, tongueY - 14)
        ctx.lineTo(0, tongueY + 10)
        ctx.strokeStyle = 'rgba(180,40,55,0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Outline
      ctx.beginPath()
      ctx.moveTo(-halfW, topY)
      ctx.quadraticCurveTo(0, topY - 20, halfW, topY)
      ctx.quadraticCurveTo(halfW + 18, botY * 0.3, halfW, botY)
      ctx.quadraticCurveTo(0, botY + 20, -halfW, botY)
      ctx.quadraticCurveTo(-halfW - 18, botY * 0.3, -halfW, topY)
      ctx.strokeStyle = cfg.mouthColor
      ctx.lineWidth = cfg.strokeWidth
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ─── Generic Cartoon Mouth (Googly style) ───────────────────────────────────

function drawCartoonMouth(ctx, cfg, params, mood) {
  const { openHeight, widthFactor, roundness, isSpeaking } = params
  const mw = cfg.mouthWidth * widthFactor
  const halfW = mw * 0.5

  ctx.save()
  ctx.translate(cfg.mouthCenter.x, cfg.mouthCenter.y)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (!isSpeaking || openHeight < 0.04) {
    // Resting smile
    ctx.beginPath()
    ctx.moveTo(-halfW * 0.5, 0)
    ctx.quadraticCurveTo(0, 16, halfW * 0.5, 0)
    ctx.strokeStyle = cfg.mouthColor
    ctx.lineWidth = cfg.strokeWidth
    ctx.stroke()
  } else {
    const mh = openHeight * 80
    const topY = -mh * 0.3
    const botY =  mh * 0.7

    if (roundness > 0.55) {
      // OO pucker
      const oor = clamp(mh * 0.42, 8, 46)
      ctx.beginPath()
      ctx.ellipse(0, 0, oor * 0.72, oor, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#100402'
      ctx.fill()
      ctx.strokeStyle = cfg.mouthColor
      ctx.lineWidth = cfg.strokeWidth
      ctx.stroke()
    } else {
      // AA open
      // Inner dark
      ctx.beginPath()
      ctx.moveTo(-halfW, topY)
      ctx.quadraticCurveTo(0, topY - 16, halfW, topY)
      ctx.quadraticCurveTo(halfW + 14, 0, halfW, botY)
      ctx.quadraticCurveTo(0, botY + 16, -halfW, botY)
      ctx.quadraticCurveTo(-halfW - 14, 0, -halfW, topY)
      ctx.fillStyle = '#100402'
      ctx.fill()

      // Teeth
      if (openHeight > 0.2) {
        const teethH = clamp(openHeight * 26, 6, 22)
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(-halfW, topY)
        ctx.quadraticCurveTo(0, topY - 16, halfW, topY)
        ctx.lineTo(halfW, topY + teethH)
        ctx.lineTo(-halfW, topY + teethH)
        ctx.closePath()
        ctx.clip()
        ctx.fillStyle = cfg.teethColor
        ctx.fill()
        // Dividers
        for (let i = 1; i < 4; i++) {
          const tx = -halfW + (mw / 4) * i
          ctx.beginPath()
          ctx.moveTo(tx, topY)
          ctx.lineTo(tx, topY + teethH)
          ctx.strokeStyle = 'rgba(0,0,0,0.12)'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
        ctx.restore()
      }

      // Tongue
      if (openHeight > 0.58) {
        ctx.beginPath()
        ctx.ellipse(0, botY - 10, halfW * 0.5, 17, 0, 0, Math.PI * 2)
        ctx.fillStyle = cfg.tongueColor
        ctx.fill()
      }

      // Outline
      ctx.beginPath()
      ctx.moveTo(-halfW, topY)
      ctx.quadraticCurveTo(0, topY - 16, halfW, topY)
      ctx.quadraticCurveTo(halfW + 14, 0, halfW, botY)
      ctx.quadraticCurveTo(0, botY + 16, -halfW, botY)
      ctx.quadraticCurveTo(-halfW - 14, 0, -halfW, topY)
      ctx.strokeStyle = cfg.mouthColor
      ctx.lineWidth = cfg.strokeWidth
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ─── STYLE D: Minimalist Dot-Line ────────────────────────────────────────────

function drawMinimalistEye(ctx, cfg, ex, ey, blinkP, sx, sy) {
  const r = cfg.eyeRadius
  ctx.save()
  ctx.translate(ex, ey)

  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.clip()

  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = cfg.eyeColor
  ctx.fill()

  // Tiny highlight
  ctx.beginPath()
  const ho = cfg.highlightOffset
  ctx.arc(ho.x, ho.y, cfg.highlightRadius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fill()

  drawEyelidMask(ctx, r, r, blinkP, true)
  ctx.restore()

  ctx.restore()
}

function drawMinimalistMouth(ctx, cfg, params) {
  const { openHeight, isSpeaking } = params
  const mw = cfg.mouthWidth

  ctx.save()
  ctx.translate(cfg.mouthCenter.x, cfg.mouthCenter.y)
  ctx.strokeStyle = cfg.mouthColor
  ctx.lineWidth = cfg.strokeWidth
  ctx.lineCap = 'round'

  if (!isSpeaking || openHeight < 0.05) {
    ctx.beginPath()
    ctx.moveTo(-mw * 0.4, 0)
    ctx.quadraticCurveTo(0, 18, mw * 0.4, 0)
    ctx.stroke()
  } else {
    const mh = openHeight * 55
    ctx.beginPath()
    ctx.ellipse(0, mh * 0.1, mw * 0.38, mh * 0.5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#111'
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

function drawMinimalistFace(ctx, cfg, mouthParams, eyeState, mood, layers, gazeOffset) {
  const { blinkProgress, saccadeOffset } = eyeState
  const gx = (gazeOffset?.x || 0) * 10
  const gy = (gazeOffset?.y || 0) * 6
  const sx = clamp(saccadeOffset.x + gx, -10, 10)
  const sy = clamp(saccadeOffset.y + gy, -6, 6)

  if (layers?.eyes !== false) {
    drawMinimalistEye(ctx, cfg, cfg.leftEye.x,  cfg.leftEye.y,  blinkProgress, sx, sy)
    drawMinimalistEye(ctx, cfg, cfg.rightEye.x, cfg.rightEye.y, blinkProgress, sx, sy)
  }
  if (layers?.mouth !== false) drawMinimalistMouth(ctx, cfg, mouthParams)
}

// ─── STYLE E: Rubber-Hose 1930s ──────────────────────────────────────────────

function drawRubberhoseEye(ctx, cfg, ex, ey, blinkP, sx, sy, mood) {
  const r = cfg.eyeRadius

  ctx.save()
  ctx.translate(ex, ey)

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.3)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 4

  // Full black circle
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = cfg.eyeColor
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // Pie-cut white "iris" window: a white sector showing the pupil
  const pieRad = (cfg.pieAngle * Math.PI) / 180
  const pupilAngle = Math.atan2(sy, sx) // follow gaze
  const startAngle = pupilAngle - pieRad / 2
  const endAngle   = pupilAngle + pieRad / 2

  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.arc(0, 0, r - 3, startAngle, endAngle)
  ctx.closePath()
  ctx.fillStyle = cfg.pupilColor
  ctx.fill()

  // Blink mask clipped to eye circle
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.clip()
  drawEyelidMask(ctx, r, r, blinkP, true)
  ctx.restore()

  // Rim outline
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.strokeStyle = cfg.eyeColor
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.restore()
}

function drawRubberhoseMouth(ctx, cfg, params, mood) {
  const { openHeight, widthFactor, roundness, isSpeaking } = params
  const mw = cfg.mouthWidth * widthFactor
  const halfW = mw * 0.5

  ctx.save()
  ctx.translate(cfg.mouthCenter.x, cfg.mouthCenter.y)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (!isSpeaking || openHeight < 0.04) {
    // 1930s rubber-hose grin — slightly asymmetric
    const smileY = mood === 'angry' ? -10 : mood === 'sad' ? -8 : 18
    const ctrl   = mood === 'angry' ? -28 : mood === 'sad' ? 28 : -4
    ctx.beginPath()
    ctx.moveTo(-halfW * 0.6, mood === 'angry' ? 14 : 4)
    ctx.quadraticCurveTo(0, mood === 'angry' ? ctrl : smileY, halfW * 0.6, mood === 'angry' ? 14 : 4)
    ctx.strokeStyle = cfg.mouthColor
    ctx.lineWidth = cfg.strokeWidth
    ctx.stroke()
  } else {
    const mh = openHeight * 85
    const topY = -mh * 0.3
    const botY =  mh * 0.7

    // OO / round
    if (roundness > 0.55) {
      const oor = clamp(mh * 0.4, 10, 44)
      ctx.beginPath()
      ctx.ellipse(0, 0, oor * 0.7, oor, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#0a0806'
      ctx.fill()
      ctx.strokeStyle = cfg.mouthColor
      ctx.lineWidth = cfg.strokeWidth
      ctx.stroke()
    } else {
      // Wide open with thick rubber outlines
      ctx.beginPath()
      ctx.moveTo(-halfW, topY)
      ctx.quadraticCurveTo(0, topY - 22, halfW, topY)
      ctx.quadraticCurveTo(halfW + 16, 0, halfW, botY)
      ctx.quadraticCurveTo(0, botY + 22, -halfW, botY)
      ctx.quadraticCurveTo(-halfW - 16, 0, -halfW, topY)
      ctx.fillStyle = '#0a0806'
      ctx.fill()

      if (openHeight > 0.2) {
        const th = clamp(openHeight * 28, 8, 26)
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(-halfW, topY)
        ctx.quadraticCurveTo(0, topY - 22, halfW, topY)
        ctx.lineTo(halfW, topY + th)
        ctx.lineTo(-halfW, topY + th)
        ctx.closePath()
        ctx.clip()
        ctx.fillStyle = cfg.teethColor
        ctx.fill()
        ctx.restore()
      }

      ctx.beginPath()
      ctx.moveTo(-halfW, topY)
      ctx.quadraticCurveTo(0, topY - 22, halfW, topY)
      ctx.quadraticCurveTo(halfW + 16, 0, halfW, botY)
      ctx.quadraticCurveTo(0, botY + 22, -halfW, botY)
      ctx.quadraticCurveTo(-halfW - 16, 0, -halfW, topY)
      ctx.strokeStyle = cfg.mouthColor
      ctx.lineWidth = cfg.strokeWidth + 1
      ctx.stroke()
    }
  }

  ctx.restore()
}

function drawRubberhoseFace(ctx, cfg, mouthParams, eyeState, mood, layers, gazeOffset) {
  const { blinkProgress, saccadeOffset } = eyeState
  const gx = (gazeOffset?.x || 0) * 16
  const gy = (gazeOffset?.y || 0) * 9
  const sx = clamp(saccadeOffset.x + gx, -16, 16)
  const sy = clamp(saccadeOffset.y + gy, -9, 9)

  if (cfg.eyebrowEnabled && layers?.eyebrows !== false) {
    drawComicEyebrow(ctx, cfg, cfg.eyebrowLeft.x,  cfg.eyebrowLeft.y,  mood, -1)
    drawComicEyebrow(ctx, cfg, cfg.eyebrowRight.x, cfg.eyebrowRight.y, mood,  1)
  }

  if (layers?.eyes !== false) {
    drawRubberhoseEye(ctx, cfg, cfg.leftEye.x,  cfg.leftEye.y,  blinkProgress, sx, sy, mood)
    drawRubberhoseEye(ctx, cfg, cfg.rightEye.x, cfg.rightEye.y, blinkProgress, sx, sy, mood)
  }
  if (layers?.mouth !== false) drawRubberhoseMouth(ctx, cfg, mouthParams, mood)
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Render a complete face rig frame.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} params
 *   style        - 'googly' | 'kawaii' | 'comic'
 *   config       - STYLE_CONFIGS[style]
 *   mouthParams  - from LipSyncEngine.getMouthParams()
 *   eyeState     - from BlinkPhysics.update(t)
 *   mood         - 'normal' | 'happy' | 'shocked' | 'angry' | 'sad'
 *   cx, cy       - face center in canvas coords
 *   faceScale    - uniform scale (1.0 = default)
 *   bgMode       - 'transparent' | 'greenscreen' | 'composite'
 *   bgImage      - HTMLImageElement or null
 */
export function renderFrame(ctx, params) {
  const {
    style, config, mouthParams, eyeState, mood,
    cx, cy, faceScale,
    bgMode, bgImage,
    canvasW, canvasH,
    layers,
    gazeOffset = { x: 0, y: 0 },
  } = params

  // 1. Background
  ctx.clearRect(0, 0, canvasW, canvasH)
  if (bgMode === 'greenscreen') {
    ctx.fillStyle = '#00FF00'
    ctx.fillRect(0, 0, canvasW, canvasH)
  } else if (bgMode === 'composite' && bgImage) {
    // Cover-fit the background image
    const iw = bgImage.naturalWidth  || bgImage.width
    const ih = bgImage.naturalHeight || bgImage.height
    const scale = Math.max(canvasW / iw, canvasH / ih)
    const dw = iw * scale
    const dh = ih * scale
    const dx = (canvasW - dw) / 2
    const dy = (canvasH - dh) / 2
    ctx.drawImage(bgImage, dx, dy, dw, dh)
  }
  // transparent: nothing (clearRect already done)

  // 2. Face
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(faceScale, faceScale)

  switch (style) {
    case 'kawaii':
      drawKawaiiiFace(ctx, config, mouthParams, eyeState, mood, layers, gazeOffset)
      break
    case 'comic':
      drawComicFace(ctx, config, mouthParams, eyeState, mood, layers, gazeOffset)
      break
    case 'minimalist':
      drawMinimalistFace(ctx, config, mouthParams, eyeState, mood, layers, gazeOffset)
      break
    case 'rubberhose':
      drawRubberhoseFace(ctx, config, mouthParams, eyeState, mood, layers, gazeOffset)
      break
    case 'googly':
    default:
      drawGooglyFace(ctx, config, mouthParams, eyeState, mood, layers, gazeOffset)
      break
  }

  ctx.restore()
}
