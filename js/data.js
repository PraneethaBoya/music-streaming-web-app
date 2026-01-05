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

  buildLegacySongFromCatalog(artist, album, song) {
    const songId = song?.songId != null ? String(song.songId) : '';
    const title = song?.title != null ? String(song.title) : '';
    const artistName = artist?.artistName != null ? String(artist.artistName) : '';
    const albumName = album?.albumName != null ? String(album.albumName) : '';
    const cover = album?.albumCover != null ? String(album.albumCover) : '';
    const audio = song?.audioUrl != null ? String(song.audioUrl) : '';
    const duration = song?.duration != null ? String(song.duration) : '';

    return {
      id: songId,
      title,
      artist: artistName,
      album: albumName,
      duration,
      cover,
      audio,
      coverImage: cover,
      audioUrl: audio,
      language: ''
    };
  }

  getCatalog() {
    return Array.isArray(this.data?.catalog) ? this.data.catalog : [];
  }

  getAllSongsFromCatalog() {
    const catalog = this.getCatalog();
    const songs = [];
    for (const artist of catalog) {
      const albums = Array.isArray(artist?.albums) ? artist.albums : [];
      for (const album of albums) {
        const albumSongs = Array.isArray(album?.songs) ? album.songs : [];
        for (const song of albumSongs) {
          songs.push(this.buildLegacySongFromCatalog(artist, album, song));
        }
      }
    }
    return songs;
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

      const apiRes = await fetch(`${apiBaseUrl}/catalog`).catch(() => null);
      if (apiRes && apiRes.ok) {
        const catalog = await apiRes.json();
        this.data = {
          catalog: Array.isArray(catalog) ? catalog : [],
          playlists: []
        };
        this.loaded = true;
        return this.data;
      }

      const response = await fetch('./data.json');
      const local = await response.json();
      this.data = {
        catalog: Array.isArray(local?.catalog) ? local.catalog : [],
        playlists: Array.isArray(local?.playlists) ? local.playlists : []
      };
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
    return this.getAllSongsFromCatalog();
  }

  /**
   * Get song by ID
   */
  getSongById(id) {
    const key = id != null ? String(id) : '';
    const catalog = this.getCatalog();
    for (const artist of catalog) {
      const albums = Array.isArray(artist?.albums) ? artist.albums : [];
      for (const album of albums) {
        const songs = Array.isArray(album?.songs) ? album.songs : [];
        for (const s of songs) {
          const songId = s?.songId != null ? String(s.songId) : '';
          if (songId === key) return this.buildLegacySongFromCatalog(artist, album, s);
        }
      }
    }
    return null;
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
    const catalog = this.getCatalog();
    return catalog.map(a => ({
      id: a.artistId,
      name: a.artistName,
      image: (a.artistImage && String(a.artistImage).trim() !== '') ? a.artistImage : '/assets/artists/default-artist.jpg',
      followers: '0'
    }));
  }

  /**
   * Get artist by ID
   */
  getArtistById(id) {
    const key = id != null ? Number(id) : null;
    const catalog = this.getCatalog();
    const found = catalog.find(a => Number(a.artistId) === key);
    if (!found) return null;
    return {
      id: found.artistId,
      name: found.artistName,
      image: found.artistImage || '',
      followers: '0'
    };
  }

  /**
   * Get all albums
   */
  getAlbums() {
    const catalog = this.getCatalog();
    const albums = [];
    for (const artist of catalog) {
      const aName = artist?.artistName != null ? String(artist.artistName) : '';
      const aId = artist?.artistId;
      const list = Array.isArray(artist?.albums) ? artist.albums : [];
      for (const album of list) {
        albums.push({
          id: album.albumId,
          title: album.albumName,
          artist: aName,
          artistId: aId,
          cover: album.albumCover || ''
        });
      }
    }
    return albums;
  }

  /**
   * Get album by ID
   */
  getAlbumById(id) {
    const key = id != null ? Number(id) : null;
    const albums = this.getAlbums();
    return albums.find(a => Number(a.id) === key);
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
    
    const songs = this.getSongs().filter(song =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.album.toLowerCase().includes(lowerQuery)
    );

    const artists = this.getArtists().filter(artist =>
      String(artist.name || '').toLowerCase().includes(lowerQuery)
    );

    const albums = this.getAlbums().filter(album =>
      String(album.title || '').toLowerCase().includes(lowerQuery) ||
      String(album.artist || '').toLowerCase().includes(lowerQuery)
    );

    return { songs, artists, albums };
  }
}

// Export singleton instance
const dataManager = new DataManager();

