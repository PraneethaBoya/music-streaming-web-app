/**
 * Music Tracking Module
 * Tracks recently played and play counts
 */

class TrackingManager {
  constructor() {
    this.profileManager = profileManager;
    this.init();
  }

  /**
   * Initialize tracking manager
   */
  init() {
    // Listen to player events
    if (window.musicPlayer) {
      // Track when songs are played
      this.setupPlayerTracking();
    }
  }

  /**
   * Setup player event tracking
   */
  setupPlayerTracking() {
    // This will be called when a song starts playing
    // We'll hook into the player's loadSong method
  }

  /**
   * Track song play
   */
  trackPlay(songId) {
    const user = this.profileManager.getCurrentUser();
    
    // Update recently played
    this.addToRecentlyPlayed(songId);
    
    // Update play count
    this.incrementPlayCount(songId);
    
    this.profileManager.currentUser = user;
    this.profileManager.saveUser();
  }

  /**
   * Add to recently played
   */
  addToRecentlyPlayed(songId) {
    const user = this.profileManager.getCurrentUser();
    let recentlyPlayed = user.recentlyPlayed || [];
    
    // Remove if already exists
    recentlyPlayed = recentlyPlayed.filter(id => id !== songId);
    
    // Add to beginning
    recentlyPlayed.unshift(songId);
    
    // Keep only last 50
    recentlyPlayed = recentlyPlayed.slice(0, 50);
    
    user.recentlyPlayed = recentlyPlayed;
  }

  /**
   * Get recently played songs
   */
  getRecentlyPlayed(limit = 10) {
    const user = this.profileManager.getCurrentUser();
    const recentlyPlayed = user.recentlyPlayed || [];
    return recentlyPlayed.slice(0, limit);
  }

  /**
   * Increment play count
   */
  incrementPlayCount(songId) {
    const user = this.profileManager.getCurrentUser();
    const playCounts = user.playCounts || {};
    playCounts[songId] = (playCounts[songId] || 0) + 1;
    user.playCounts = playCounts;
  }

  /**
   * Get play count for song
   */
  getPlayCount(songId) {
    const user = this.profileManager.getCurrentUser();
    const playCounts = user.playCounts || {};
    return playCounts[songId] || 0;
  }

  /**
   * Get most played songs
   */
  getMostPlayed(limit = 10) {
    const user = this.profileManager.getCurrentUser();
    const playCounts = user.playCounts || {};
    
    // Convert to array and sort
    const songs = Object.entries(playCounts)
      .map(([songId, count]) => ({
        id: parseInt(songId),
        count: count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.id);
    
    return songs;
  }

  /**
   * Get trending songs (most played in last period)
   */
  getTrending(limit = 10) {
    // For now, return most played
    // In a real app, this would consider time-based trends
    return this.getMostPlayed(limit);
  }

  clearHistory() {
    const user = this.profileManager.getCurrentUser();
    user.recentlyPlayed = [];
    user.playCounts = {};
    this.profileManager.currentUser = user;
    this.profileManager.saveUser();
  }
}

// Export singleton instance
const trackingManager = new TrackingManager();

