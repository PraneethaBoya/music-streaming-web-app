/**
 * API Configuration
 * Update this with your backend URL after deployment
 */

// Development (local)
const API_BASE_URL = (typeof window !== 'undefined' && window.location)
  ? `${window.location.origin}/api`
  : 'http://localhost:3000/api';

// Production (update with your deployed backend URL)
// const API_BASE_URL = 'https://your-backend-url.railway.app/api';

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_BASE_URL };
} else {
  window.API_BASE_URL = API_BASE_URL;
}

