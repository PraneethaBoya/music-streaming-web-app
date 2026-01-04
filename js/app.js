/**
 * Main Application File
 * Initializes and coordinates all modules
 */

// Make managers globally available
if (typeof musicPlayer !== 'undefined') window.musicPlayer = musicPlayer;
if (typeof trackingManager !== 'undefined') window.trackingManager = trackingManager;
if (typeof audioVisualizer !== 'undefined') window.audioVisualizer = audioVisualizer;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in (for protected pages)
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const protectedPages = ['home.html', 'search.html', 'playlist.html', 'library.html', 'liked-songs.html', 'upload.html', 'create-playlist.html', 'create-album.html'];
  
  // Handle auth pages first (they don't need data loading)
  if (currentPage === 'login.html' || currentPage === 'signup.html' || currentPage === 'reset-password.html') {
    // Auth pages are handled by auth.js
    return; // Exit early for auth pages
  }
  
  // Protect pages - check authentication
  if (protectedPages.includes(currentPage)) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = 'login.html';
      return;
    }
  }

  // Initialize data manager (only for non-auth pages)
  try {
    if (typeof dataManager !== 'undefined') {
      await dataManager.loadData();
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }

  // Initialize profile manager (must be first to set up user)
  if (typeof profileManager !== 'undefined') {
    // Profile manager auto-initializes
  }

  // Initialize UI manager (only for non-auth pages)
  try {
    if (typeof uiManager !== 'undefined') {
      uiManager.initPlayerControls();
      uiManager.initSearch();
    }
  } catch (error) {
    console.error('Error initializing UI:', error);
  }

  // Page-specific initialization
  switch (currentPage) {
    case 'index.html':
    case '':
      initLandingPage();
      break;
    case 'home.html':
      initHomePage();
      break;
    case 'playlist.html':
      initPlaylistPage();
      break;
    case 'search.html':
      initSearchPage();
      break;
  }
});

/**
 * Initialize Landing Page
 */
function initLandingPage() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * Initialize Home Page
 */
async function initHomePage() {
  // Load and render recently listened (from tracking)
  const recentlyListenedIds = trackingManager.getRecentlyPlayed(12);
  const recentlyListened = dataManager.getSongsByIds(recentlyListenedIds);
  if (recentlyListened.length > 0) {
    uiManager.renderSongsGrid(recentlyListened, 'recently-listened');
  } else {
    // Fallback to static data
    const fallback = dataManager.getRecentlyPlayed();
    uiManager.renderSongsGrid(fallback, 'recently-listened');
  }

  // Load and render mostly listened
  const mostlyListenedIds = trackingManager.getMostPlayed(12);
  const mostlyListened = dataManager.getSongsByIds(mostlyListenedIds);
  if (mostlyListened.length > 0) {
    uiManager.renderSongsGrid(mostlyListened, 'mostly-listened');
  } else {
    // Show empty state
    document.getElementById('mostly-listened').innerHTML = '<p class="loading">Start playing songs to see your most played tracks</p>';
  }

  // Load and render trending
  const trendingIds = trackingManager.getTrending(12);
  const trending = dataManager.getSongsByIds(trendingIds);
  if (trending.length > 0) {
    uiManager.renderSongsGrid(trending, 'trending');
  } else {
    // Fallback to static data
    const fallback = dataManager.getTrending();
    uiManager.renderSongsGrid(fallback, 'trending');
  }

  // Load and render new releases
  const newReleases = dataManager.getNewReleases();
  uiManager.renderSongsGrid(newReleases, 'new-releases');

  // Load and render popular artists
  const artists = dataManager.getArtists();
  uiManager.renderArtistsGrid(artists, 'popular-artists');

  // Load and render artist playlists (auto-generated)
  const artistPlaylists = playlistManager.getArtistPlaylists();
  if (artistPlaylists.length > 0) {
    uiManager.renderPlaylistsGrid(artistPlaylists.slice(0, 6), 'artist-playlists');
  }

  // Load and render recommended playlists
  const playlists = dataManager.getPlaylists().slice(0, 4);
  const playlistsContainer = document.getElementById('recommended-playlists');
  if (playlistsContainer) {
    uiManager.renderPlaylistsGrid(playlists, 'recommended-playlists');
  }
}

/**
 * Initialize Playlist Page
 */
async function initPlaylistPage() {
  // Get playlist ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = parseInt(urlParams.get('id'));

  if (!playlistId) {
    window.location.href = 'home.html';
    return;
  }

  const playlist = dataManager.getPlaylistById(playlistId);
  if (!playlist) {
    window.location.href = 'home.html';
    return;
  }

  // Render playlist header
  const headerImage = document.getElementById('playlist-header-image');
  const headerTitle = document.getElementById('playlist-header-title');
  const headerDescription = document.getElementById('playlist-header-description');
  const headerMeta = document.getElementById('playlist-header-meta');

  if (headerImage) headerImage.src = playlist.cover;
  if (headerTitle) headerTitle.textContent = playlist.title;
  if (headerDescription) headerDescription.textContent = playlist.description || '';
  if (headerMeta) {
    headerMeta.innerHTML = `
      <span>${playlist.songs.length} songs</span>
    `;
  }

  // Render playlist songs
  const songs = dataManager.getSongsByIds(playlist.songs);
  uiManager.renderSongsList(songs, 'playlist-songs');

  // Play playlist button
  const playPlaylistBtn = document.getElementById('play-playlist-btn');
  if (playPlaylistBtn) {
    playPlaylistBtn.addEventListener('click', () => {
      uiManager.playPlaylist(playlistId);
    });
  }
}

/**
 * Initialize Search Page
 */
function initSearchPage() {
  // Search functionality is handled by uiManager.initSearch()
  // Additional search page specific logic can be added here
}

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
  location.reload();
});

