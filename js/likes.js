/**
 * Like/Unlike Songs Module
 * Handles song liking functionality with localStorage
 */

class LikeManager {
  constructor() {
    this.profileManager = profileManager;
    this.init();
  }

  /**
   * Initialize like manager
   */
  init() {
    this.updateLikeButtons();
  }

  /**
   * Toggle like status for a song
   */
  toggleLike(songId) {
    const user = this.profileManager.getCurrentUser();
    const likedSongs = user.likedSongs || [];
    const index = likedSongs.indexOf(songId);

    if (index > -1) {
      // Unlike
      likedSongs.splice(index, 1);
    } else {
      // Like
      likedSongs.push(songId);
    }

    user.likedSongs = likedSongs;
    this.profileManager.currentUser = user;
    this.profileManager.saveUser();

    // Update UI
    this.updateLikeButton(songId);
    
    return !(index > -1); // Return true if liked, false if unliked
  }

  /**
   * Check if song is liked
   */
  isLiked(songId) {
    const user = this.profileManager.getCurrentUser();
    const likedSongs = user.likedSongs || [];
    return likedSongs.includes(songId);
  }

  /**
   * Get all liked songs
   */
  getLikedSongs() {
    const user = this.profileManager.getCurrentUser();
    return user.likedSongs || [];
  }

  /**
   * Update like button for specific song
   */
  updateLikeButton(songId) {
    const buttons = document.querySelectorAll(`[data-like-song-id="${songId}"]`);
    const isLiked = this.isLiked(songId);

    buttons.forEach(btn => {
      if (isLiked) {
        btn.classList.add('liked');
        btn.innerHTML = '<i class="icon-heart-filled">❤️</i>';
        btn.setAttribute('title', 'Unlike');
      } else {
        btn.classList.remove('liked');
        btn.innerHTML = '<i class="icon-heart">🤍</i>';
        btn.setAttribute('title', 'Like');
      }
    });
  }

  /**
   * Update all like buttons on page
   */
  updateLikeButtons() {
    const buttons = document.querySelectorAll('[data-like-song-id]');
    buttons.forEach(btn => {
      const songId = parseInt(btn.getAttribute('data-like-song-id'));
      this.updateLikeButton(songId);
    });
  }

  /**
   * Render like button
   */
  renderLikeButton(songId, size = 'medium') {
    const isLiked = this.isLiked(songId);
    const sizeClass = size === 'small' ? 'like-btn-small' : 'like-btn';
    
    return `
      <button class="${sizeClass} ${isLiked ? 'liked' : ''}" 
              data-like-song-id="${songId}" 
              title="${isLiked ? 'Unlike' : 'Like'}">
        <i class="icon-heart">${isLiked ? '❤️' : '🤍'}</i>
      </button>
    `;
  }
}

// Export singleton instance
const likeManager = new LikeManager();

