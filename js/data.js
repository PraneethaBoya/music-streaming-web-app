/**
 * Data Management Module
 * Handles loading and managing music data
 */

class DataManager {
  constructor() {
    this.data = null;
    this.loaded = false;
  }

  normalizeKeyPart(value) {
    return String(value || '').trim().toLowerCase();
  }

  buildDedupeKey(song) {
    const title = this.normalizeKeyPart(song?.title);
    const artist = this.normalizeKeyPart(song?.artist);
    const audioUrl = this.normalizeKeyPart(song?.audioUrl || song?.audio);
    return `${title}||${artist}||${audioUrl}`;
  }

  isBlockedSong(song) {
    const title = this.normalizeKeyPart(song?.title);
    return title === 'em sandheham' || title === 'em sandhem';
  }

  cleanClientCaches(removedSongIds) {
    try {
      const raw = sessionStorage.getItem('musicPlayerState');
      if (raw) {
        const state = JSON.parse(raw);
        const id = state?.id != null ? String(state.id) : '';
        const title = this.normalizeKeyPart(state?.title);
        if ((id && removedSongIds.has(id)) || title === 'em sandheham' || title === 'em sandhem') {
          sessionStorage.removeItem('musicPlayerState');
        }
      }
    } catch (e) {
    }

    try {
      const userRaw = localStorage.getItem('musicStreamUser');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const liked = Array.isArray(user?.likedSongs) ? user.likedSongs.map(s => String(s)) : [];
        const filtered = liked.filter(id => !removedSongIds.has(String(id)));
        if (filtered.length !== liked.length) {
          user.likedSongs = filtered;
          localStorage.setItem('musicStreamUser', JSON.stringify(user));
        }
      }
    } catch (e) {
    }
  }

  normalizeSong(raw) {
    const id = raw?.id != null ? String(raw.id) : '';
    const title = raw?.title != null ? String(raw.title) : '';
    const artist = raw?.artist != null ? String(raw.artist) : '';
    const album = raw?.album != null ? String(raw.album) : '';
    const duration = raw?.duration != null && String(raw.duration).trim() !== '' ? raw.duration : '';
    const cover = raw?.cover || raw?.cover_url || raw?.coverImage || raw?.cover_image || '';
    const audio = raw?.audio || raw?.audio_url || raw?.audioUrl || raw?.audio_url || '';
    const language = raw?.language || raw?.genre || '';

    return {
      id,
      title,
      artist,
      album,
      duration,
      language: language != null ? String(language) : '',
      cover,
      audio,
      coverImage: cover,
      audioUrl: audio
    };
  }

  /**
   * Load music data from JSON file
   */
  async loadData() {
    if (this.loaded) {
      return this.data;
    }

    try {
      const apiBaseUrl = (typeof window !== 'undefined' && window.API_BASE_URL)
        ? window.API_BASE_URL
        : `${window.location.origin}/api`;

      const apiRes = await fetch(`${apiBaseUrl}/songs`).catch(() => null);
      if (apiRes && apiRes.ok) {
        const songs = await apiRes.json();
        const normalized = Array.isArray(songs) ? songs.map(s => this.normalizeSong(s)) : [];
        const removedSongIds = new Set();
        const seen = new Set();
        const uniqueSongs = [];

        for (const song of normalized) {
          if (this.isBlockedSong(song)) {
            if (song?.id != null) removedSongIds.add(String(song.id));
            continue;
          }
          const key = this.buildDedupeKey(song);
          if (seen.has(key)) {
            if (song?.id != null) removedSongIds.add(String(song.id));
            continue;
          }
          seen.add(key);
          uniqueSongs.push(song);
        }

        this.data = {
          songs: uniqueSongs,
          artists: [],
          albums: [],
          playlists: []
        };

        if (removedSongIds.size > 0) {
          this.cleanClientCaches(removedSongIds);
        }

        this.loaded = true;
        return this.data;
      }

      const response = await fetch('./data.json');
      const local = await response.json();
      const normalizedSongs = Array.isArray(local?.songs) ? local.songs.map(s => this.normalizeSong(s)) : [];
      const removedSongIds = new Set();
      const seen = new Set();
      const uniqueSongs = [];

      for (const song of normalizedSongs) {
        if (this.isBlockedSong(song)) {
          if (song?.id != null) removedSongIds.add(String(song.id));
          continue;
        }
        const key = this.buildDedupeKey(song);
        if (seen.has(key)) {
          if (song?.id != null) removedSongIds.add(String(song.id));
          continue;
        }
        seen.add(key);
        uniqueSongs.push(song);
      }

      const songIdSet = new Set(uniqueSongs.map(s => String(s.id)));
      const playlists = Array.isArray(local?.playlists) ? local.playlists.map(p => {
        const songs = Array.isArray(p?.songs) ? p.songs.map(id => String(id)).filter(id => songIdSet.has(id)) : [];
        return { ...p, songs };
      }) : [];

      this.data = {
        songs: uniqueSongs,
        artists: Array.isArray(local?.artists) ? local.artists : [],
        albums: Array.isArray(local?.albums) ? local.albums : [],
        playlists
      };

      if (removedSongIds.size > 0) {
        this.cleanClientCaches(removedSongIds);
      }
      this.loaded = true;
      return this.data;
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  }

  /**
   * Get all songs
   */
  getSongs() {
    return this.data?.songs || [];
  }

  /**
   * Get song by ID
   */
  getSongById(id) {
    const key = id != null ? String(id) : '';
    return this.data?.songs.find(song => String(song.id) === key);
  }

  /**
   * Get songs by IDs
   */
  getSongsByIds(ids) {
    return ids.map(id => this.getSongById(id)).filter(Boolean);
  }

  /**
   * Get all artists
   */
  getArtists() {
    return this.data?.artists || [];
  }

  /**
   * Get artist by ID
   */
  getArtistById(id) {
    return this.data?.artists.find(artist => artist.id === id);
  }

  /**
   * Get all albums
   */
  getAlbums() {
    return this.data?.albums || [];
  }

  /**
   * Get album by ID
   */
  getAlbumById(id) {
    return this.data?.albums.find(album => album.id === id);
  }

  /**
   * Get all playlists
   */
  getPlaylists() {
    return this.data?.playlists || [];
  }

  /**
   * Get playlist by ID
   */
  getPlaylistById(id) {
    return this.data?.playlists.find(playlist => playlist.id === id);
  }

  /**
   * Get recently played songs
   */
  getRecentlyPlayed() {
    const ids = this.data?.recentlyPlayed || [];
    return this.getSongsByIds(ids);
  }

  /**
   * Get trending songs
   */
  getTrending() {
    const ids = this.data?.trending || [];
    return this.getSongsByIds(ids);
  }

  /**
   * Get new releases
   */
  getNewReleases() {
    const ids = this.data?.newReleases || [];
    return this.getSongsByIds(ids);
  }

  /**
   * Search songs, artists, albums
   */
  search(query) {
    if (!query || !this.data) return { songs: [], artists: [], albums: [] };

    const lowerQuery = query.toLowerCase();
    
    const songs = this.data.songs.filter(song => 
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.album.toLowerCase().includes(lowerQuery)
    );

    const artists = this.data.artists.filter(artist =>
      artist.name.toLowerCase().includes(lowerQuery)
    );

    const albums = this.data.albums.filter(album =>
      album.title.toLowerCase().includes(lowerQuery) ||
      album.artist.toLowerCase().includes(lowerQuery)
    );

    return { songs, artists, albums };
  }
}

// Export singleton instance
const dataManager = new DataManager();

