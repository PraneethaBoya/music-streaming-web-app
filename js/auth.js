/**
 * Authentication Module
 * Postgres-backed authentication via API
 */

function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.API_BASE_URL) return window.API_BASE_URL;
  return 'http://localhost:3000/api';
}

function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setAuthSession(token, user) {
  if (token) localStorage.setItem('authToken', token);
  if (user) localStorage.setItem('musicStreamUser', JSON.stringify(user));
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
  return Boolean(getAuthToken());
}

/**
 * Login function
 */
function handleLogin() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorDiv = document.getElementById('login-error');
  
  if (!emailInput || !passwordInput) {
    console.error('Login form inputs not found');
    return;
  }
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  // Clear previous errors
  clearError();
  
  // Validation
  if (!email || !password) {
    showError('Please enter both email and password');
    highlightError(emailInput, passwordInput);
    return;
  }
  
  const apiBaseUrl = getApiBaseUrl();
  fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.error || 'Login failed';
        throw new Error(msg);
      }

      setAuthSession(data.token, data.user);
      window.location.href = 'home.html';
    })
    .catch((err) => {
      showError(err.message || 'Invalid email or password');
      highlightError(emailInput, passwordInput);
      passwordInput.value = '';
      passwordInput.focus();
    });
}

/**
 * Signup function
 */
function handleSignup() {
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
    return;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  const errorDiv = document.getElementById('signup-error');
  const showSignupError = (msg) => {
    if (!errorDiv) return;
    errorDiv.className = 'error-message';
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
  };
  const clearSignupError = () => {
    if (!errorDiv) return;
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  };

  clearSignupError();

  if (!name || !email || !password) {
    showSignupError('Please fill in all required fields');
    return;
  }
  if (password !== confirmPassword) {
    showSignupError('Passwords do not match');
    confirmPasswordInput.value = '';
    confirmPasswordInput.focus();
    return;
  }
  if (password.length < 6) {
    showSignupError('Password must be at least 6 characters long');
    passwordInput.focus();
    return;
  }

  const apiBaseUrl = getApiBaseUrl();
  fetch(`${apiBaseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
    .then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.error || 'Signup failed';
        throw new Error(msg);
      }

      setAuthSession(data.token, data.user);
      window.location.href = 'home.html';
    })
    .catch((err) => {
      showSignupError(err.message || 'Signup failed');
    });
}

function initSignupPage() {
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSignup();
      return false;
    });
  }

  const inputs = ['name', 'email', 'password', 'confirm-password'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        const errorDiv = document.getElementById('signup-error');
        if (errorDiv) {
          errorDiv.textContent = '';
          errorDiv.style.display = 'none';
        }
        input.classList.remove('input-error');
      });
    }
  });
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

/**
 * Clear error message
 */
function clearError() {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }
  
  // Remove error highlighting
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  if (emailInput) emailInput.classList.remove('input-error');
  if (passwordInput) passwordInput.classList.remove('input-error');
}

/**
 * Highlight input fields with error
 */
function highlightError(...inputs) {
  inputs.forEach(input => {
    if (input) {
      input.classList.add('input-error');
    }
  });
}

/**
 * Initialize login page
 */
function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    // Prevent form submission
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleLogin();
      return false;
    });
    
    // Also prevent on form submit button click
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogin();
        return false;
      });
    }
  } else {
    console.error('Login form not found!');
  }
  
  // Clear error when user starts typing
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  if (emailInput) {
    emailInput.addEventListener('input', clearError);
  }
  if (passwordInput) {
    passwordInput.addEventListener('input', clearError);
  }
  
  // Handle forgot password link
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showForgotPasswordModal();
    });
  }
}

/**
 * Show forgot password modal
 */
function showForgotPasswordModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 450px;">
      <div class="modal-header">
        <h2>Reset Password</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
          Enter your email address and we'll send you a reset code.
        </p>
        <div class="form-group">
          <label for="reset-email">Email Address</label>
          <input type="email" id="reset-email" placeholder="Enter your email" required>
        </div>
        <div id="reset-message" style="display: none; margin-top: var(--spacing-md);"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
        <button type="button" class="btn btn-primary modal-send-reset">Send Reset Code</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);

  const emailInput = document.getElementById('reset-email');
  const messageDiv = document.getElementById('reset-message');
  const sendBtn = modal.querySelector('.modal-send-reset');

  // Handle send reset code
  sendBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    
    if (!email) {
      messageDiv.innerHTML = '<div class="error-message">Please enter your email address</div>';
      messageDiv.style.display = 'block';
      return;
    }

    const registeredUsers = JSON.parse(localStorage.getItem('musicStreamUsers') || '[]');
    const user = registeredUsers.find(u => u.email === email);
    if (!user) {
      messageDiv.innerHTML = '<div class="error-message">Email not registered</div>';
      messageDiv.style.display = 'block';
      return;
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save reset code in localStorage (expires in 10 minutes)
    const resetData = {
      code: resetCode,
      email: email,
      expires: Date.now() + (10 * 60 * 1000) // 10 minutes
    };
    localStorage.setItem('resetCode', JSON.stringify(resetData));
    
    // Show success message
    messageDiv.innerHTML = `
      <div class="success-message">
        <div style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: var(--spacing-md);">✉️</div>
          <div style="font-weight: 600; margin-bottom: var(--spacing-sm);">Reset code sent!</div>
          <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-md);">
            We've sent a reset code to <strong>${email}</strong>
          </div>
          <div style="padding: var(--spacing-md); background: var(--bg-hover); border-radius: 8px; font-family: monospace; font-size: var(--font-size-lg); font-weight: 600; color: #FF0066; margin-bottom: var(--spacing-sm);">
            ${resetCode}
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--spacing-md);">
            Keep this code safe. It expires in 10 minutes.
          </div>
          <a href="reset-password.html" class="btn btn-primary" style="display: inline-block; margin-top: var(--spacing-md);">Continue to Reset Password</a>
        </div>
      </div>
    `;
    messageDiv.style.display = 'block';
    
    // Hide send button
    sendBtn.style.display = 'none';
  });

  // Close modal handlers
  modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
  modal.querySelector('.modal-cancel').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
}

/**
 * Close modal
 */
function closeModal(modal) {
  modal.classList.remove('active');
  setTimeout(() => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }, 300);
}

/**
 * Protect pages - redirect to login if not authenticated
 */
function protectPage() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

/**
 * Logout function
 */
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('musicStreamUser');
    window.location.href = "login.html";
  }
}

// Make logout available globally
window.logout = logout;

