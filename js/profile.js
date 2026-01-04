/**
 * Profile Management Module
 * Handles user profile, avatar, and account features
 */

class ProfileManager {
  constructor() {
    this.currentUser = this.loadUser();
    this.init();
  }

  /**
   * Initialize profile manager
   */
  init() {
    this.renderProfileAvatar();
    this.initProfileDropdown();
    this.loadProfileData();
  }

  /**
   * Load user from localStorage
   */
  loadUser() {
    const userStr = localStorage.getItem('musicStreamUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
    
    // Default user if none exists
    return {
      username: 'Music Lover',
      email: 'user@musicstream.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop',
      likedSongs: [],
      playlists: [],
      recentlyPlayed: [],
      playCounts: {}
    };
  }

  /**
   * Save user to localStorage
   */
  saveUser() {
    localStorage.setItem('musicStreamUser', JSON.stringify(this.currentUser));
  }

  /**
   * Render profile avatar in top nav
   */
  renderProfileAvatar() {
    const profileElements = document.querySelectorAll('.profile-img');
    profileElements.forEach(img => {
      if (this.currentUser.avatar) {
        img.src = this.currentUser.avatar;
        img.alt = this.currentUser.username;
      }
    });
  }

  /**
   * Initialize profile dropdown
   */
  initProfileDropdown() {
    const profileElements = document.querySelectorAll('.profile');
    
    profileElements.forEach(profile => {
      const img = profile.querySelector('.profile-img');
      if (!img) return;

      // Create dropdown
      const dropdown = document.createElement('div');
      dropdown.className = 'profile-dropdown';
      dropdown.innerHTML = `
        <div class="profile-dropdown-header">
          <img src="${this.currentUser.avatar}" alt="${this.currentUser.username}" class="profile-dropdown-avatar">
          <div class="profile-dropdown-info">
            <div class="profile-dropdown-name">${this.currentUser.username}</div>
            <div class="profile-dropdown-email">${this.currentUser.email}</div>
          </div>
        </div>
        <div class="profile-dropdown-menu">
          <button class="profile-dropdown-item" id="profile-edit-btn">
            <i class="icon-edit">✏️</i> Edit Profile
          </button>
          <button class="profile-dropdown-item" id="profile-avatar-btn">
            <i class="icon-photo">📷</i> Change Photo
          </button>
          <div class="profile-dropdown-divider"></div>
          <button class="profile-dropdown-item" id="profile-logout-btn">
            <i class="icon-logout">🚪</i> Logout
          </button>
        </div>
      `;

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'profile-dropdown-overlay';

      // Toggle dropdown
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('active');
        
        if (isOpen) {
          this.closeDropdown(dropdown, overlay);
        } else {
          this.openDropdown(dropdown, overlay, profile);
        }
      });

      // Close on overlay click
      overlay.addEventListener('click', () => {
        this.closeDropdown(dropdown, overlay);
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!profile.contains(e.target) && !dropdown.contains(e.target)) {
          this.closeDropdown(dropdown, overlay);
        }
      });

      // Handle menu items
      dropdown.querySelector('#profile-edit-btn')?.addEventListener('click', () => {
        this.showEditProfile();
        this.closeDropdown(dropdown, overlay);
      });

      dropdown.querySelector('#profile-avatar-btn')?.addEventListener('click', () => {
        this.showChangeAvatar();
        this.closeDropdown(dropdown, overlay);
      });

      dropdown.querySelector('#profile-logout-btn')?.addEventListener('click', () => {
        this.logout();
      });
    });
  }

  /**
   * Open dropdown
   */
  openDropdown(dropdown, overlay, profile) {
    document.body.appendChild(overlay);
    document.body.appendChild(dropdown);
    
    const rect = profile.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 8}px`;
    dropdown.style.right = `${window.innerWidth - rect.right}px`;
    
    setTimeout(() => {
      dropdown.classList.add('active');
      overlay.classList.add('active');
    }, 10);
  }

  /**
   * Close dropdown
   */
  closeDropdown(dropdown, overlay) {
    dropdown.classList.remove('active');
    overlay.classList.remove('active');
    
    setTimeout(() => {
      if (dropdown.parentNode) dropdown.parentNode.removeChild(dropdown);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
  }

  /**
   * Show edit profile modal
   */
  showEditProfile() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Profile</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="edit-username">Username</label>
            <input type="text" id="edit-username" value="${this.currentUser.username}">
          </div>
          <div class="form-group">
            <label for="edit-email">Email</label>
            <input type="email" id="edit-email" value="${this.currentUser.email}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary modal-save">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal(modal));
    modal.querySelector('.modal-cancel').addEventListener('click', () => this.closeModal(modal));
    modal.querySelector('.modal-save').addEventListener('click', () => {
      const username = document.getElementById('edit-username').value;
      const email = document.getElementById('edit-email').value;
      this.updateProfile(username, email);
      this.closeModal(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal(modal);
    });
  }

  /**
   * Show change avatar modal
   */
  showChangeAvatar() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Change Profile Photo</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="avatar-preview-container">
            <img src="${this.currentUser.avatar}" alt="Preview" id="avatar-preview" class="avatar-preview">
          </div>
          <div class="form-group">
            <label for="avatar-upload">Choose Image</label>
            <input type="file" id="avatar-upload" accept="image/*">
          </div>
          <div class="form-group">
            <label for="avatar-url">Or Enter URL</label>
            <input type="url" id="avatar-url" placeholder="https://example.com/image.jpg">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary modal-save">Save Photo</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const preview = document.getElementById('avatar-preview');
    const fileInput = document.getElementById('avatar-upload');
    const urlInput = document.getElementById('avatar-url');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          preview.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    urlInput.addEventListener('input', (e) => {
      if (e.target.value) {
        preview.src = e.target.value;
      }
    });

    modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal(modal));
    modal.querySelector('.modal-cancel').addEventListener('click', () => this.closeModal(modal));
    modal.querySelector('.modal-save').addEventListener('click', () => {
      const newAvatar = preview.src;
      this.updateAvatar(newAvatar);
      this.closeModal(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal(modal);
    });
  }

  /**
   * Update profile
   */
  updateProfile(username, email) {
    this.currentUser.username = username;
    this.currentUser.email = email;
    this.saveUser();
    this.renderProfileAvatar();
    this.initProfileDropdown();
  }

  /**
   * Update avatar
   */
  updateAvatar(avatarUrl) {
    this.currentUser.avatar = avatarUrl;
    this.saveUser();
    this.renderProfileAvatar();
    this.initProfileDropdown();
  }

  /**
   * Close modal
   */
  closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    }, 300);
  }

  /**
   * Logout
   */
  logout() {
    if (confirm('Are you sure you want to logout?')) {
      // Use auth.js logout if available
      if (typeof window.logout === 'function') {
        window.logout();
        return;
      }
      
      // Fallback logout
      localStorage.clear();
      window.location.href = 'login.html';
    }
  }

  /**
   * Load profile data
   */
  loadProfileData() {
    return this.currentUser;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }
}

// Export singleton instance
const profileManager = new ProfileManager();

