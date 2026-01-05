/**
 * UI Module
 * Handles rendering and UI interactions
 */

class UIManager {
  constructor() {
    this.dataManager = dataManager;
    this.player = musicPlayer;
    this.likeManager = likeManager;
    this.trackingManager = trackingManager;
  }

  getFallbackCover() {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">'
        + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        + '<stop offset="0" stop-color="#1b1b1b"/><stop offset="1" stop-color="#0a0a0a"/>'
        + '</linearGradient></defs>'
        + '<rect width="800" height="800" fill="url(#g)"/>'
        + '<circle cx="400" cy="400" r="220" fill="#111" stroke="#ff2d8d" stroke-width="10"/>'
        + '<circle cx="400" cy="400" r="18" fill="#ff2d8d"/>'
        + '<text x="400" y="710" fill="#bdbdbd" font-size="44" font-family="Inter, Arial" text-anchor="middle">MusicStream</text>'
      + '</svg>'
    );
  }

  normalizeSongId(songId) {
    return songId != null ? String(songId) : '';
  }

  getCoverSrc(song) {
    const cover = song?.cover || song?.coverImage || '';
    return cover && String(cover).trim() !== ''
      ? cover
      : this.getFallbackCover();
  }

  getDurationText(song) {
    const d = song?.duration;
    return d == null || String(d).trim() === '' || String(d).toLowerCase() === 'null'
      ? ''
      : String(d);
  }

  /**
   * Render song card
   */
  renderSongCard(song) {
    const likeBtn = this.likeManager.renderLikeButton(this.normalizeSongId(song?.id), 'small');
    const coverSrc = this.getCoverSrc(song);
    const fallback = this.getFallbackCover();
    return `
      <div class="song-card" data-song-id="${song.id}">
        <div class="song-card-image-wrapper">
          <img src="${coverSrc}" alt="${song?.title || ''}" class="song-card-image" onerror="this.onerror=null;this.src='${fallback}'">
          <div class="play-overlay">
            <button class="play-song-btn" data-song-id="${song.id}">
              <span class="player-icon">▶️</span>
            </button>
          </div>
          <div class="song-card-like">
            ${likeBtn}
          </div>
        </div>
        <div class="song-card-title">${song.title}</div>
        <div class="song-card-artist">${song.artist}</div>
      </div>
    `;
  }

  /**
   * Render song list item
   */
  renderSongListItem(song, index = null) {
    const number = index !== null ? index + 1 : '';
    const likeBtn = this.likeManager.renderLikeButton(this.normalizeSongId(song?.id), 'small');
    const coverSrc = this.getCoverSrc(song);
    const fallback = this.getFallbackCover();
    const durationText = this.getDurationText(song);
    return `
      <div class="song-list-item" data-song-id="${song.id}">
        ${number ? `<div class="song-list-number">${number}</div>` : ''}
        <img src="${coverSrc}" alt="${song?.title || ''}" class="song-list-image" onerror="this.onerror=null;this.src='${fallback}'">
        <div class="song-list-info">
          <div class="song-list-title">${song.title}</div>
          <div class="song-list-artist">${song.artist}</div>
        </div>
        <div class="song-list-actions">
          ${likeBtn}
        </div>
        <div class="song-list-duration">${durationText}</div>
      </div>
    `;
  }

  /**
   * Render artist card
   */
  renderArtistCard(artist) {
    return `
      <div class="artist-card" data-artist-id="${artist.id}">
        <img src="${artist.image}" alt="${artist.name}" class="artist-image">
        <div class="artist-name">${artist.name}</div>
        <div class="artist-followers">${artist.followers} followers</div>
      </div>
    `;
  }

  /**
   * Render playlist card
   */
  renderPlaylistCard(playlist) {
    return `
      <div class="song-card" data-playlist-id="${playlist.id}">
        <div class="song-card-image-wrapper">
          <img src="${playlist.cover}" alt="${playlist.title}" class="song-card-image">
          <div class="play-overlay">
            <button class="play-playlist-btn" data-playlist-id="${playlist.id}">
              <i class="icon-play"></i>
            </button>
          </div>
        </div>
        <div class="song-card-title">${playlist.title}</div>
        <div class="song-card-artist">${playlist.description || 'Playlist'}</div>
      </div>
    `;
  }

  /**
   * Render songs grid
   */
  renderSongsGrid(songs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (songs.length === 0) {
      container.innerHTML = '<p class="loading">No songs found</p>';
      return;
    }

    container.innerHTML = songs.map(song => this.renderSongCard(song)).join('');
    this.attachSongCardListeners(container);
  }

  /**
   * Render songs list
   */
  renderSongsList(songs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (songs.length === 0) {
      container.innerHTML = '<p class="loading">No songs found</p>';
      return;
    }

    container.innerHTML = songs.map((song, index) => this.renderSongListItem(song, index)).join('');
    this.attachSongListItemListeners(container);
  }

  /**
   * Render artists grid
   */
  renderArtistsGrid(artists, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (artists.length === 0) {
      container.innerHTML = '<p class="loading">No artists available</p>';
      return;
    }

    container.innerHTML = artists.map(artist => this.renderArtistCard(artist)).join('');
  }

  /**
   * Render playlists grid
   */
  renderPlaylistsGrid(playlists, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (playlists.length === 0) {
      container.innerHTML = '<p class="loading">No playlists found</p>';
      return;
    }

    container.innerHTML = playlists.map(playlist => this.renderPlaylistCard(playlist)).join('');
    this.attachPlaylistCardListeners(container);
  }

  /**
   * Attach song card listeners
   */
  attachSongCardListeners(container) {
    container.querySelectorAll('.play-song-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = btn.getAttribute('data-song-id');
        this.playSong(this.normalizeSongId(songId));
      });
    });

    container.querySelectorAll('.song-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.play-overlay') && !e.target.closest('.song-card-like')) {
          const songId = card.getAttribute('data-song-id');
          this.playSong(this.normalizeSongId(songId));
        }
      });
    });

    // Attach like button listeners
    container.querySelectorAll('[data-like-song-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = btn.getAttribute('data-like-song-id');
        this.likeManager.toggleLike(this.normalizeSongId(songId));
      });
    });
  }

  /**
   * Attach song list item listeners
   */
  attachSongListItemListeners(container) {
    container.querySelectorAll('.song-list-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.song-list-actions')) {
          const songId = item.getAttribute('data-song-id');
          this.playSong(this.normalizeSongId(songId));
        }
      });
    });

    // Attach like button listeners
    container.querySelectorAll('[data-like-song-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = btn.getAttribute('data-like-song-id');
        this.likeManager.toggleLike(this.normalizeSongId(songId));
      });
    });
  }

  /**
   * Attach playlist card listeners
   */
  attachPlaylistCardListeners(container) {
    container.querySelectorAll('.play-playlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const playlistId = parseInt(btn.getAttribute('data-playlist-id'));
        this.playPlaylist(playlistId);
      });
    });

    container.querySelectorAll('[data-playlist-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.play-overlay')) {
          const playlistId = parseInt(card.getAttribute('data-playlist-id'));
          window.location.href = `playlist.html?id=${playlistId}`;
        }
      });
    });
  }

  /**
   * Play a song
   */
  async playSong(songId) {
    const song = this.dataManager.getSongById(this.normalizeSongId(songId));
    if (!song) return;

    // Get all songs for playlist
    const allSongs = this.dataManager.getSongs();
    await this.player.loadSong(song, allSongs);
  }

  /**
   * Play a playlist
   */
  async playPlaylist(playlistId) {
    const playlist = this.dataManager.getPlaylistById(playlistId);
    if (!playlist) return;

    const songs = this.dataManager.getSongsByIds(playlist.songs);
    if (songs.length === 0) return;

    await this.player.loadSong(songs[0], songs);
  }

  /**
   * Initialize player controls
   */
  initPlayerControls() {
    const hasSongs = (this.dataManager.getSongs() || []).length > 0;

    // Play/Pause button
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
      if (!hasSongs) {
        playBtn.disabled = true;
        playBtn.style.pointerEvents = 'none';
      }
      playBtn.addEventListener('click', () => {
        if (!hasSongs) return;
        this.player.togglePlay();
      });
    }

    // Previous button
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
      if (!hasSongs) {
        prevBtn.disabled = true;
        prevBtn.style.pointerEvents = 'none';
      }
      prevBtn.addEventListener('click', () => {
        if (!hasSongs) return;
        this.player.previous();
      });
    }

    // Next button
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      if (!hasSongs) {
        nextBtn.disabled = true;
        nextBtn.style.pointerEvents = 'none';
      }
      nextBtn.addEventListener('click', () => {
        if (!hasSongs) return;
        this.player.next();
      });
    }

    // Shuffle button
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
      if (!hasSongs) {
        shuffleBtn.disabled = true;
        shuffleBtn.style.pointerEvents = 'none';
      }
      shuffleBtn.addEventListener('click', () => {
        if (!hasSongs) return;
        this.player.toggleShuffle();
      });
    }

    // Repeat button
    const repeatBtn = document.getElementById('repeat-btn');
    if (repeatBtn) {
      if (!hasSongs) {
        repeatBtn.disabled = true;
        repeatBtn.style.pointerEvents = 'none';
      }
      repeatBtn.addEventListener('click', () => {
        if (!hasSongs) return;
        this.player.toggleRepeat();
      });
    }

    // Progress bar
    const progressBar = document.getElementById('player-progress-bar');
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        this.player.seek(percent);
      });
    }

    // Volume slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.player.setVolume(e.target.value / 100);
      });
    }

    // Volume slider container (for click to seek)
    const volumeSliderContainer = document.getElementById('volume-slider-container');
    if (volumeSliderContainer) {
      volumeSliderContainer.addEventListener('click', (e) => {
        const rect = volumeSliderContainer.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        this.player.setVolume(percent / 100);
      });
    }
  }

  /**
   * Initialize search
   */
  initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();

      searchTimeout = setTimeout(() => {
        if (query.length > 0) {
          this.performSearch(query);
        } else {
          this.clearSearch();
        }
      }, 300);
    });
  }

  /**
   * Perform search
   */
  performSearch(query) {
    const results = this.dataManager.search(query);
    const resultsContainer = document.getElementById('search-results');
    
    if (!resultsContainer) return;
    
    if (results.songs.length === 0 && results.artists.length === 0 && results.albums.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-2xl); color: var(--text-secondary);">
          <p>No results found for "${query}"</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    if (results.songs.length > 0) {
      html += '<div><h2 style="margin-bottom: var(--spacing-lg);">Songs</h2>';
      html += '<div class="song-list">';
      html += results.songs.map((song, index) => this.renderSongListItem(song, index)).join('');
      html += '</div></div>';
    }
    
    if (results.artists.length > 0) {
      html += '<div><h2 style="margin-bottom: var(--spacing-lg); margin-top: var(--spacing-xl);">Artists</h2>';
      html += '<div class="artist-grid">';
      html += results.artists.map(artist => this.renderArtistCard(artist)).join('');
      html += '</div></div>';
    }
    
    if (results.albums.length > 0) {
      html += '<div><h2 style="margin-bottom: var(--spacing-lg); margin-top: var(--spacing-xl);">Albums</h2>';
      html += '<div class="song-grid">';
      html += results.albums.map(album => `
        <div class="song-card" data-album-id="${album.id}">
          <div class="song-card-image-wrapper">
            <img src="${album.cover}" alt="${album.title}" class="song-card-image">
          </div>
          <div class="song-card-title">${album.title}</div>
          <div class="song-card-artist">${album.artist}</div>
        </div>
      `).join('');
      html += '</div></div>';
    }
    
    resultsContainer.innerHTML = html;
    
    // Attach listeners
    this.attachSongListItemListeners(resultsContainer);
  }

  /**
   * Clear search
   */
  clearSearch() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-2xl); color: var(--text-secondary);">
          <p>Start typing to search...</p>
        </div>
      `;
    }
  }
}

// Export singleton instance
const uiManager = new UIManager();

