/**
 * Data Management Module
 * Handles loading and managing music data
 */

class DataManager {
  constructor() {
    this.data = null;
    this.loaded = false;
  }

  /**
   * Load music data from JSON file
   */
  async loadData() {
    if (this.loaded) {
      return this.data;
    }

    try {
      const response = await fetch('./data.json');
      this.data = await response.json();
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
    return this.data?.songs.find(song => song.id === id);
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

