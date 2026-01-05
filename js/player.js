/**
 * Music Player Module
 * Handles audio playback, controls, and state management
 */

class MusicPlayer {
  constructor() {
    this.audio = new Audio();
    this.currentSong = null;
    this.currentIndex = -1;
    this.playlist = [];
    this.isPlaying = false;
    this.isShuffled = false;
    this.repeatMode = 'off'; // 'off', 'one', 'all'
    this.volume = 0.5;
    this.shuffledPlaylist = [];
    this.originalPlaylist = [];

    // Bind methods
    this.init();
  }

  getSongAudioUrl(song) {
    return (song && (song.audio || song.audioUrl)) ? String(song.audio || song.audioUrl) : '';
  }

  getSongCoverUrl(song) {
    return (song && (song.cover || song.coverImage)) ? String(song.cover || song.coverImage) : '';
  }

  ensureNowPlayingOverlay() {
    if (document.getElementById('now-playing-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'now-playing-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.92)',
      'backdrop-filter:blur(10px)',
      'display:none',
      'z-index:9999',
      'padding:24px',
      'box-sizing:border-box'
    ].join(';');

    overlay.innerHTML = `
      <div id="now-playing-close" style="position:absolute;top:16px;right:16px;font-size:28px;cursor:pointer;line-height:1;">✕</div>
      <div style="max-width:520px;margin:48px auto 0;display:flex;flex-direction:column;gap:16px;align-items:center;text-align:center;">
        <img id="now-playing-cover" src="" alt="" style="width:min(76vw,360px);height:min(76vw,360px);object-fit:cover;border-radius:18px;box-shadow:0 20px 80px rgba(0,0,0,0.55);" />
        <div style="width:100%;">
          <div id="now-playing-title" style="font-size:22px;font-weight:700;"> </div>
          <div id="now-playing-artist" style="margin-top:6px;opacity:0.8;"> </div>
        </div>
        <div id="now-playing-like"></div>
        <div style="width:100%;height:160px;border-radius:16px;overflow:hidden;">
          <canvas id="now-playing-visualizer" style="width:100%;height:100%;display:block;"></canvas>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#now-playing-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    }
  }

  /**
   * Initialize player
   */
  init() {
    this.audio.volume = this.volume;

    this.ensureNowPlayingOverlay();
    
    // Connect to visualizer if available
    if (window.audioVisualizer) {
      window.audioVisualizer.connectAudio(this.audio);
    }
    
    // Event listeners
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('play', () => {
      // Start visualizer when playing
      if (window.audioVisualizer) {
        window.audioVisualizer.start();
      }

      const overlay = document.getElementById('now-playing-overlay');
      if (overlay) overlay.style.display = 'block';
    });

    this.audio.addEventListener('pause', () => {
      // Stop visualizer when paused
      if (window.audioVisualizer) {
        window.audioVisualizer.stop();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.handleSongEnd();
      // Stop visualizer when ended
      if (window.audioVisualizer) {
        window.audioVisualizer.stop();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.handleError();
      // Stop visualizer on error
      if (window.audioVisualizer) {
        window.audioVisualizer.stop();
      }
    });

    // Load volume from localStorage
    const savedVolume = localStorage.getItem('musicPlayerVolume');
    if (savedVolume !== null) {
      this.setVolume(parseFloat(savedVolume));
    }
  }

  /**
   * Load and play a song
   */
  async loadSong(song, playlist = null) {
    const audioUrl = this.getSongAudioUrl(song);
    if (!song || !audioUrl) {
      console.error('Invalid song data');
      return;
    }

    this.currentSong = song;
    
    if (playlist) {
      this.setPlaylist(playlist);
      this.currentIndex = this.playlist.findIndex(s => s.id === song.id);
    }

    try {
      // Connect visualizer before loading audio
      if (window.audioVisualizer && !window.audioVisualizer.audioSource) {
        window.audioVisualizer.connectAudio(this.audio);
      }
      
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = audioUrl;
      this.audio.load();
      this.updateUI();
      
      // Track song play
      if (window.trackingManager) {
        window.trackingManager.trackPlay(song.id);
      }
      
      this.play();
    } catch (error) {
      console.error('Error loading song:', error);
      this.handleError();
    }
  }

  /**
   * Set playlist
   */
  setPlaylist(songs) {
    this.originalPlaylist = [...songs];
    this.playlist = this.isShuffled ? this.shuffleArray([...songs]) : [...songs];
    this.shuffledPlaylist = this.isShuffled ? [...this.playlist] : [];
  }

  /**
   * Play audio
   */
  play() {
    this.audio.play()
      .then(() => {
        this.isPlaying = true;
        this.updatePlayButton();
      })
      .catch(error => {
        console.error('Play error:', error);
        this.isPlaying = false;
        this.updatePlayButton();
      });
  }

  /**
   * Pause audio
   */
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayButton();
    
    // Stop visualizer
    if (window.audioVisualizer) {
      window.audioVisualizer.stop();
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Play next song
   */
  next() {
    if (this.playlist.length === 0) return;

    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.play();
      return;
    }

    let nextIndex = this.currentIndex + 1;

    if (nextIndex >= this.playlist.length) {
      if (this.repeatMode === 'all') {
        nextIndex = 0;
      } else {
        this.pause();
        return;
      }
    }

    this.currentIndex = nextIndex;
    this.loadSong(this.playlist[nextIndex]);
  }

  /**
   * Play previous song
   */
  previous() {
    if (this.playlist.length === 0) return;

    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    let prevIndex = this.currentIndex - 1;

    if (prevIndex < 0) {
      if (this.repeatMode === 'all') {
        prevIndex = this.playlist.length - 1;
      } else {
        this.audio.currentTime = 0;
        return;
      }
    }

    this.currentIndex = prevIndex;
    this.loadSong(this.playlist[prevIndex]);
  }

  /**
   * Toggle shuffle
   */
  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    
    if (this.isShuffled) {
      this.shuffledPlaylist = this.shuffleArray([...this.originalPlaylist]);
      const currentSongId = this.currentSong?.id;
      const currentIndexInShuffled = this.shuffledPlaylist.findIndex(s => s.id === currentSongId);
      this.playlist = this.shuffledPlaylist;
      this.currentIndex = currentIndexInShuffled >= 0 ? currentIndexInShuffled : 0;
    } else {
      const currentSongId = this.currentSong?.id;
      const currentIndexInOriginal = this.originalPlaylist.findIndex(s => s.id === currentSongId);
      this.playlist = this.originalPlaylist;
      this.currentIndex = currentIndexInOriginal >= 0 ? currentIndexInOriginal : 0;
    }

    this.updateShuffleButton();
  }

  /**
   * Toggle repeat mode
   */
  toggleRepeat() {
    const modes = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
    this.updateRepeatButton();
  }

  /**
   * Set volume
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this.audio.volume = this.volume;
    localStorage.setItem('musicPlayerVolume', this.volume);
    this.updateVolumeUI();

    // Adjust visualizer intensity based on volume
    if (window.audioVisualizer && typeof window.audioVisualizer.setVolume === 'function') {
      window.audioVisualizer.setVolume(this.volume);
    }
  }

  /**
   * Seek to position
   */
  seek(position) {
    if (this.audio.duration) {
      this.audio.currentTime = (position / 100) * this.audio.duration;
    }
  }

  /**
   * Handle song end
   */
  handleSongEnd() {
    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.play();
    } else {
      this.next();
    }
  }

  /**
   * Handle errors
   */
  handleError() {
    console.error('Player error occurred');
    this.isPlaying = false;
    this.updatePlayButton();
  }

  /**
   * Update progress bar
   */
  updateProgress() {
    if (!this.audio.duration) return;

    const progress = (this.audio.currentTime / this.audio.duration) * 100;
    const progressBar = document.getElementById('player-progress-fill');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    // Update time displays
    const currentTimeEl = document.getElementById('player-current-time');
    const durationEl = document.getElementById('player-duration');

    if (currentTimeEl) {
      currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }
    if (durationEl) {
      durationEl.textContent = this.formatTime(this.audio.duration);
    }
  }

  /**
   * Update UI elements
   */
  updateUI() {
    if (!this.currentSong) return;

    // Update now playing info
    const imageEl = document.getElementById('player-now-playing-image');
    const titleEl = document.getElementById('player-now-playing-title');
    const artistEl = document.getElementById('player-now-playing-artist');
    const nowPlayingInfo = document.querySelector('.player-now-playing-info');

    if (imageEl) {
      imageEl.src = this.getSongCoverUrl(this.currentSong) || '';
      imageEl.style.display = 'block';
    }
    if (titleEl) titleEl.textContent = this.currentSong.title;
    if (artistEl) artistEl.textContent = this.currentSong.artist;
    if (nowPlayingInfo) nowPlayingInfo.style.display = 'block';

    // Update play button
    this.updatePlayButton();

    // Highlight current song in lists
    this.highlightCurrentSong();

    const overlay = document.getElementById('now-playing-overlay');
    if (overlay) {
      const coverEl = document.getElementById('now-playing-cover');
      const titleEl2 = document.getElementById('now-playing-title');
      const artistEl2 = document.getElementById('now-playing-artist');
      const likeEl = document.getElementById('now-playing-like');

      const cover = this.getSongCoverUrl(this.currentSong);
      if (coverEl) {
        coverEl.src = cover && cover.trim() !== '' ? cover : 'https://via.placeholder.com/600x600/111111/FFFFFF?text=Music';
        coverEl.alt = this.currentSong.title || '';
      }
      if (titleEl2) titleEl2.textContent = this.currentSong.title || '';
      if (artistEl2) artistEl2.textContent = this.currentSong.artist || '';

      if (likeEl && window.likeManager && typeof window.likeManager.renderLikeButton === 'function') {
        likeEl.innerHTML = window.likeManager.renderLikeButton(String(this.currentSong.id), 'medium');
        const btn = likeEl.querySelector('[data-like-song-id]');
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.likeManager.toggleLike(String(this.currentSong.id));
          });
        }
      }

      const canvas = document.getElementById('now-playing-visualizer');
      if (canvas && window.audioVisualizer && window.audioVisualizer.canvas !== canvas) {
        try {
          window.audioVisualizer.canvas = canvas;
          window.audioVisualizer.ctx = canvas.getContext('2d');
          if (typeof window.audioVisualizer.resize === 'function') window.audioVisualizer.resize();
        } catch (e) {
        }
      }
    }
  }

  /**
   * Update play button
   */
  updatePlayButton() {
    const playBtn = document.getElementById('play-btn');
    if (!playBtn) return;

    const icon = playBtn.querySelector('i') || playBtn;
    if (this.isPlaying) {
      icon.className = 'icon-pause';
      playBtn.setAttribute('aria-label', 'Pause');
    } else {
      icon.className = 'icon-play';
      playBtn.setAttribute('aria-label', 'Play');
    }
  }

  /**
   * Update shuffle button
   */
  updateShuffleButton() {
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
      shuffleBtn.classList.toggle('active', this.isShuffled);
    }
  }

  /**
   * Update repeat button
   */
  updateRepeatButton() {
    const repeatBtn = document.getElementById('repeat-btn');
    if (repeatBtn) {
      repeatBtn.classList.toggle('active', this.repeatMode !== 'off');
      if (this.repeatMode === 'one') {
        repeatBtn.setAttribute('data-mode', 'one');
      } else {
        repeatBtn.setAttribute('data-mode', 'all');
      }
    }
  }

  /**
   * Update volume UI
   */
  updateVolumeUI() {
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.value = this.volume * 100;
    }

    const volumeFill = document.getElementById('player-volume-fill');
    if (volumeFill) {
      volumeFill.style.width = `${this.volume * 100}%`;
    }
  }

  /**
   * Highlight current song in lists
   */
  highlightCurrentSong() {
    // Remove previous highlights
    document.querySelectorAll('.song-list-item.playing').forEach(el => {
      el.classList.remove('playing');
    });

    // Add highlight to current song
    if (this.currentSong) {
      const songItems = document.querySelectorAll(`[data-song-id="${this.currentSong.id}"]`);
      songItems.forEach(item => {
        item.classList.add('playing');
      });
    }
  }

  /**
   * Format time (seconds to MM:SS)
   */
  formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get current song
   */
  getCurrentSong() {
    return this.currentSong;
  }

  /**
   * Check if playing
   */
  getIsPlaying() {
    return this.isPlaying;
  }
}

// Export singleton instance
const musicPlayer = new MusicPlayer();

