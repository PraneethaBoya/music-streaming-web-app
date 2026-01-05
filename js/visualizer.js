/**
 * Audio Visualizer Module
 * Real-time audio wave visualization using Web Audio API and Canvas
 */

class AudioVisualizer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.freqArray = null;
    this.animationFrameId = null;
    this.isPlaying = false;
    this.audioSource = null;
    this.connected = false;

    // Rendering state
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.t = 0;
    this.alpha = 0;
    this.targetAlpha = 0;
    this.volume = 0.5;
    this.rms = 0;
    this.energy = 0;
    this.beat = 0;
    this.phase = 0;
    this.ampSmooth = 0;
    
    // Sonic wave settings
    this.waveLayers = [
      { amp: 1.0, thickness: 2.6, speed: 0.016, freq: 1.05, blur: 30, opacity: 0.95 },
      { amp: 0.86, thickness: 2.1, speed: 0.020, freq: 1.35, blur: 26, opacity: 0.78 },
      { amp: 0.72, thickness: 1.7, speed: 0.026, freq: 1.75, blur: 22, opacity: 0.62 },
      { amp: 0.58, thickness: 1.4, speed: 0.032, freq: 2.25, blur: 18, opacity: 0.48 },
      { amp: 0.44, thickness: 1.1, speed: 0.040, freq: 2.9, blur: 14, opacity: 0.35 }
    ];
    this.pointStep = 6; // px between points (smaller = smoother but more CPU)
    this.baseAmplitude = 24; // px
    this.maxAmplitude = 92; // px
    
    // Gradient colors (Neon Blue waveform)
    this.gradientColors = [
      { r: 79, g: 195, b: 247 },   // #4FC3F7
      { r: 33, g: 150, b: 243 },   // #2196F3
      { r: 3, g: 169, b: 244 }     // #03A9F4
    ];
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  getPreferredCanvasElement() {
    const overlayCanvas = document.getElementById('now-playing-visualizer');
    if (overlayCanvas) return overlayCanvas;
    return document.getElementById('audio-visualizer');
  }

  setCanvasElement(canvas) {
    if (!canvas || this.canvas === canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();
  }

  /**
   * Initialize visualizer
   */
  init() {
    this.createCanvas();
    this.setupAudioContext();
  }

  /**
   * Create canvas element
   */
  createCanvas() {
    // Prefer the overlay canvas if present, otherwise use the fixed canvas
    let canvas = this.getPreferredCanvasElement();
    
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'audio-visualizer';
      canvas.className = 'audio-visualizer-canvas';
      
      // Insert before player bar
      const playerBar = document.querySelector('.player-bar');
      if (playerBar) {
        playerBar.parentNode.insertBefore(canvas, playerBar);
      } else {
        document.body.appendChild(canvas);
      }
    }
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Resize canvas to fit container
   */
  resizeCanvas() {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width || parseFloat(getComputedStyle(this.canvas).width) || window.innerWidth;
    const cssHeight = rect.height || parseFloat(getComputedStyle(this.canvas).height) || 200;

    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.canvas.width = Math.floor(cssWidth * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);
    if (!String(this.canvas.style.width || '').includes('%')) {
      this.canvas.style.width = `${cssWidth}px`;
    }
    if (!String(this.canvas.style.height || '').includes('%')) {
      this.canvas.style.height = `${cssHeight}px`;
    }

    // Use DPR scaling so drawing uses CSS pixels
    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  /**
   * Setup Web Audio API
   */
  setupAudioContext() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048; // more time-domain detail for smooth sine wave
      this.analyser.smoothingTimeConstant = 0.85; // smooth easing
      
      // Create data array
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Frequency array (used only to estimate low-end energy)
      this.freqArray = new Uint8Array(bufferLength);
      
    } catch (error) {
      console.error('Web Audio API not supported:', error);
    }
  }

  /**
   * Set player volume (0..1) to scale visual intensity.
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0));
  }

  /**
   * Connect audio element to visualizer
   */
  connectAudio(audioElement) {
    if (!audioElement) {
      console.warn('No audio element provided to visualizer');
      return;
    }

    if (!this.audioContext || !this.analyser) {
      this.setupAudioContext();
    }

    // Don't reconnect if already connected to this element
    if (this.connected && this.audioSource) {
      return;
    }

    try {
      // Disconnect previous source if exists
      if (this.audioSource) {
        try {
          this.audioSource.disconnect();
        } catch (e) {
          // Source already disconnected
        }
      }

      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.createAudioSource(audioElement);
        }).catch(err => {
          console.error('Error resuming audio context:', err);
        });
      } else {
        this.createAudioSource(audioElement);
      }
      
    } catch (error) {
      console.error('Error connecting audio:', error);
    }
  }

  /**
   * Create audio source connection
   */
  createAudioSource(audioElement) {
    try {
      // Create media element source
      this.audioSource = this.audioContext.createMediaElementSource(audioElement);
      
      // Connect: source -> analyser -> destination
      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      this.connected = true;
      
      // Make visualizer globally available
      window.audioVisualizer = this;
      
    } catch (error) {
      console.error('Error creating audio source:', error);
      // Some browsers may only allow one source per element
      if (error.name === 'InvalidStateError') {
        console.warn('Audio source already connected, visualizer may not work');
        this.connected = false;
      }
    }
  }

  /**
   * Start visualization
   */
  start() {
    if (this.isPlaying) return;

    // If the Now Playing overlay exists, draw there so it stays visible above the cover.
    const preferredCanvas = this.getPreferredCanvasElement();
    if (preferredCanvas) this.setCanvasElement(preferredCanvas);
    
    this.isPlaying = true;
    this.targetAlpha = 1;
    
    // Show canvas
    if (this.canvas) {
      this.canvas.classList.add('active');
    }
    
    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.animate();
  }

  /**
   * Stop visualization
   */
  stop() {
    this.isPlaying = false;
    this.targetAlpha = 0;

    this.alpha = 0;

    // Hide canvas immediately
    if (this.canvas) {
      this.canvas.classList.remove('active');
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    }
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.analyser || !this.ctx || !this.canvas) return;

    const shouldRun = this.isPlaying || this.alpha > 0.01;
    if (!shouldRun) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      // Final clear
      this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
      return;
    }

    // Request next frame
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Pause work when tab is hidden
    if (document.hidden) return;

    // Time-domain data drives wave motion
    this.analyser.getByteTimeDomainData(this.dataArray);
    // Frequency data only used to estimate low-end energy (bass/beat feel)
    this.analyser.getByteFrequencyData(this.freqArray);

    this.updateEnergy();

    // Smooth fade in/out
    const fadeSpeed = 0.08;
    this.alpha += (this.targetAlpha - this.alpha) * fadeSpeed;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const isOverlayCanvas = this.canvas && this.canvas.id === 'now-playing-visualizer';

    // Avoid darkening the cover image on the Now Playing overlay.
    // For the overlay canvas, keep a transparent background by clearing each frame.
    // For the fixed background canvas, keep a subtle trail fade.
    this.ctx.globalCompositeOperation = 'source-over';
    if (isOverlayCanvas) {
      this.ctx.clearRect(0, 0, width, height);
    } else {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${0.12})`;
      this.ctx.fillRect(0, 0, width, height);
    }

    // Draw multi-layer sonic waves
    this.drawSonicWaves(width, height);

    // Advance time (horizontal motion)
    this.t += 1;
  }

  /**
   * Update energy estimates for beat/bass style expansion.
   * Uses time-domain RMS + low-frequency energy with smoothing.
   */
  updateEnergy() {
    if (!this.dataArray || this.dataArray.length === 0) return;

    // Time-domain RMS (0..1)
    let sumSq = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const v = (this.dataArray[i] - 128) / 128;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / this.dataArray.length);
    this.rms += (rms - this.rms) * 0.18;

    // Bass-ish energy from lower bins (0..1)
    let lowSum = 0;
    const lowBins = Math.max(8, Math.floor(this.freqArray.length * 0.08));
    for (let i = 0; i < lowBins; i++) lowSum += this.freqArray[i];
    const low = (lowSum / lowBins) / 255;

    // Smoothed energy with a bit of attack/decay
    const rawEnergy = Math.min(1, (this.rms * 1.4 + low * 1.2) / 2);
    const attack = 0.22;
    const release = 0.08;
    const k = rawEnergy > this.energy ? attack : release;
    this.energy += (rawEnergy - this.energy) * k;

    // Beat accent (quick transient)
    const beatTarget = Math.max(0, this.energy - 0.25);
    this.beat += (beatTarget - this.beat) * 0.35;
  }

  /**
   * Draw a premium sine-wave style visualizer.
   * Uses time-domain data for organic motion, plus internal phase for horizontal flow.
   */
  drawSonicWaves(width, height) {
    const ctx = this.ctx;
    const centerY = height * 0.5;

    // Intensity reacts to energy + volume
    const volumeBoost = 0.35 + this.volume * 1.15;
    const intensity = Math.min(1, (this.energy * 1.1 + this.beat * 0.9)) * volumeBoost;

    const softAlpha = this.alpha;
    const len = this.dataArray && this.dataArray.length ? this.dataArray.length : 0;
    if (len === 0) return;

    // Smooth amplitude envelope (avoid jitter)
    let absSum = 0;
    for (let i = 0; i < len; i += 2) {
      absSum += Math.abs((this.dataArray[i] - 128) / 128);
    }
    const avgAbs = absSum / Math.max(1, Math.floor(len / 2));
    const ampTarget = Math.min(1, avgAbs * 1.6) * (0.65 + this.energy * 0.8);
    this.ampSmooth += (ampTarget - this.ampSmooth) * 0.12;

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, `rgba(26, 140, 255, ${0.95 * softAlpha})`);
    gradient.addColorStop(0.5, `rgba(0, 229, 255, ${0.95 * softAlpha})`);
    gradient.addColorStop(1, `rgba(168, 85, 247, ${0.95 * softAlpha})`);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.92 * softAlpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Gentle horizontal drift
    this.phase += 0.015 + this.ampSmooth * 0.02;

    const baseAmp = height * 0.12;
    const amp = baseAmp + (height * 0.28) * this.ampSmooth;

    const lines = [
      { offset: -0.18, width: 2.4, glow: 18, alpha: 0.95 },
      { offset: 0.00, width: 2.0, glow: 14, alpha: 0.78 },
      { offset: 0.18, width: 1.6, glow: 10, alpha: 0.55 }
    ];

    const xStep = 8;
    for (let li = 0; li < lines.length; li++) {
      const layer = lines[li];

      ctx.strokeStyle = gradient;
      ctx.lineWidth = layer.width;
      ctx.shadowBlur = layer.glow;
      ctx.shadowColor = `rgba(0, 229, 255, ${0.28 * softAlpha})`;
      ctx.globalAlpha = (0.92 * softAlpha) * layer.alpha;

      const y0 = centerY + height * layer.offset;
      ctx.beginPath();

      let prevX = 0;
      let prevY = y0;
      ctx.moveTo(prevX, prevY);

      for (let x = 0; x <= width + xStep; x += xStep) {
        const idx = Math.floor((x / width) * (len - 1));
        const v = (this.dataArray[idx] - 128) / 128;

        // Fluid abstract motion: combine audio + two drifting sine components
        const f1 = 1.25 + li * 0.25;
        const f2 = 2.0 + li * 0.35;
        const s = Math.sin(this.phase + (x / width) * Math.PI * 2 * f1);
        const s2 = Math.sin(this.phase * 0.72 + (x / width) * Math.PI * 2 * f2);
        const y = y0 + (v * 0.6 + s * 0.7 + s2 * 0.35) * amp;

        const cx = (prevX + x) / 2;
        const cy = (prevY + y) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cx, cy);
        prevX = x;
        prevY = y;
      }

      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  /**
   * Get average amplitude
   */
  getAverageAmplitude() {
    if (!this.dataArray || this.dataArray.length === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    return sum / this.dataArray.length / 255;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Export singleton instance
const audioVisualizer = new AudioVisualizer();

