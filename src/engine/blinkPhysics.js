/**
 * Blink Physics & Eye Dynamics for Doodle Lip-Sync Studio
 * Simulates natural human/cartoon blink rhythms using Poisson intervals,
 * double-blink chance, smooth eyelid curves, and micro-saccadic eye drift.
 */

export class BlinkPhysics {
  constructor() {
    this.blinkProgress = 0; // 0 = open, 1 = fully closed
    this.isBlinking = false;
    this.blinkStartTime = 0;
    this.blinkDuration = 0.14; // 140ms standard blink
    this.nextBlinkTime = this.getRandomInterval(2.5, 4.2);
    this.isDoubleBlinkPending = false;

    // Saccadic eye wander (subtle lifelike pupil movements)
    this.saccadeX = 0;
    this.saccadeY = 0;
    this.targetSaccadeX = 0;
    this.targetSaccadeY = 0;
    this.nextSaccadeTime = 1.5;
  }

  getRandomInterval(min, max) {
    return min + Math.random() * (max - min);
  }

  reset() {
    this.blinkProgress = 0;
    this.isBlinking = false;
    this.nextBlinkTime = this.getRandomInterval(2.5, 4.0);
    this.isDoubleBlinkPending = false;
    this.saccadeX = 0;
    this.saccadeY = 0;
  }

  /**
   * Update blink and pupil dynamics based on current video/audio time
   * @param {number} currentTime - Time in seconds
   * @returns {Object} { blinkProgress, saccadeOffset, isBlinking }
   */
  update(currentTime) {
    // 1. Check if it's time to trigger a new blink
    if (!this.isBlinking && currentTime >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkStartTime = currentTime;

      // 12% probability of a cute cartoon double-blink
      if (!this.isDoubleBlinkPending && Math.random() < 0.12) {
        this.isDoubleBlinkPending = true;
      }
    }

    // 2. Animate ongoing blink
    if (this.isBlinking) {
      const elapsed = currentTime - this.blinkStartTime;
      const progress = elapsed / this.blinkDuration;

      if (progress >= 1.0) {
        this.isBlinking = false;
        this.blinkProgress = 0;

        if (this.isDoubleBlinkPending) {
          // Trigger second blink shortly after (100ms gap)
          this.nextBlinkTime = currentTime + 0.1;
          this.isDoubleBlinkPending = false;
        } else {
          // Schedule next regular blink (Poisson-distributed)
          this.nextBlinkTime = currentTime + this.getRandomInterval(2.4, 4.5);
        }
      } else {
        // Fast snap close, smooth snap open (sinusoidal bell curve)
        this.blinkProgress = Math.sin(progress * Math.PI);
      }
    }

    // 3. Saccadic eye drift (gentle natural pupil micro-wandering)
    if (currentTime >= this.nextSaccadeTime) {
      this.targetSaccadeX = (Math.random() - 0.5) * 8; // +/- 4px
      this.targetSaccadeY = (Math.random() - 0.5) * 5; // +/- 2.5px
      this.nextSaccadeTime = currentTime + this.getRandomInterval(1.2, 2.8);
    }

    // Smoothly interpolate saccade
    this.saccadeX += (this.targetSaccadeX - this.saccadeX) * 0.12;
    this.saccadeY += (this.targetSaccadeY - this.saccadeY) * 0.12;

    return {
      blinkProgress: this.blinkProgress,
      isBlinking: this.isBlinking,
      saccadeOffset: {
        x: this.saccadeX,
        y: this.saccadeY,
      },
    };
  }
}
