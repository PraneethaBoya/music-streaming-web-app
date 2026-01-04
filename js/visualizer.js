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
    
    // Sonic wave settings
    this.waveLayers = [
      { amp: 1.0, thickness: 2.2, speed: 0.018, freq: 1.2, blur: 26, opacity: 0.85 },
      { amp: 0.72, thickness: 1.8, speed: 0.024, freq: 1.75, blur: 18, opacity: 0.65 },
      { amp: 0.5, thickness: 1.4, speed: 0.031, freq: 2.4, blur: 12, opacity: 0.45 }
    ];
    this.pointStep = 6; // px between points (smaller = smoother but more CPU)
    this.baseAmplitude = 24; // px
    this.maxAmplitude = 92; // px
    
    // Gradient colors (PicsArt style)
    this.gradientColors = [
      { r: 255, g: 0, b: 102 },    // #FF0066 - Hot Pink
      { r: 245, g: 0, b: 143 },    // #F5008F - Magenta Pink
      { r: 142, g: 45, b: 226 }    // #8E2DE2 - Purple
    ];
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
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
    // Check if canvas already exists
    let canvas = document.getElementById('audio-visualizer');
    
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

    // Canvas is positioned fixed; width follows viewport
    const cssWidth = window.innerWidth;
    const cssHeight = parseFloat(getComputedStyle(this.canvas).height) || 200;

    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.canvas.width = Math.floor(cssWidth * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

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

    // Hide canvas with fade
    if (this.canvas) {
      this.canvas.classList.remove('active');
    }

    // Keep animating until we fade out fully, then cancel rAF
    if (!this.animationFrameId) {
      this.animate();
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

    // Subtle trail fade for “continuous flow”
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = `rgba(0, 0, 0, ${0.12})`;
    this.ctx.fillRect(0, 0, width, height);

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

    const amp = this.baseAmplitude + (this.maxAmplitude - this.baseAmplitude) * intensity;
    const softAlpha = this.alpha;

    // Gradient stroke
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, `rgba(255, 0, 102, ${0.95 * softAlpha})`);
    gradient.addColorStop(0.5, `rgba(245, 0, 143, ${0.95 * softAlpha})`);
    gradient.addColorStop(1, `rgba(142, 45, 226, ${0.95 * softAlpha})`);

    // Use additive blending for neon layering
    ctx.globalCompositeOperation = 'lighter';

    // Smooth time-domain sample mapping across width
    const bufferLen = this.dataArray.length;
    const step = Math.max(3, Math.floor(this.pointStep));
    const points = Math.floor(width / step);

    for (let layerIndex = 0; layerIndex < this.waveLayers.length; layerIndex++) {
      const layer = this.waveLayers[layerIndex];
      const phase = this.t * layer.speed;
      const layerAmp = amp * layer.amp;

      // Build path
      ctx.beginPath();

      for (let p = 0; p <= points; p++) {
        const x = p * step;
        const normX = x / width;

        // Sample time-domain data and map to [-1..1]
        const dataIndex = Math.min(bufferLen - 1, Math.floor(normX * bufferLen));
        const td = (this.dataArray[dataIndex] - 128) / 128;

        // A sine foundation + time-domain modulation (smooth, no sharp bars)
        const sine = Math.sin((normX * Math.PI * 2 * layer.freq) + phase);
        const wobble = td * 0.75;
        const y = centerY + (sine + wobble) * layerAmp;

        if (p === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Glow settings per layer
      ctx.strokeStyle = gradient;
      ctx.lineWidth = layer.thickness;
      ctx.globalAlpha = layer.opacity * softAlpha;
      ctx.shadowBlur = layer.blur;
      ctx.shadowColor = `rgba(255, 0, 102, ${0.35 * softAlpha})`;
      ctx.stroke();

      // Subtle secondary stroke for crisper center line
      ctx.shadowBlur = 0;
      ctx.globalAlpha = (layer.opacity * 0.55) * softAlpha;
      ctx.lineWidth = Math.max(1, layer.thickness * 0.75);
      ctx.stroke();
    }

    // Reset alpha/composite
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
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

