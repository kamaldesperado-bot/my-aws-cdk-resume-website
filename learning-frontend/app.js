// API endpoint
const API_BASE = 'https://9jwkbf8f70.execute-api.eu-central-1.amazonaws.com/prod';

// Check if user is already logged in
const token = localStorage.getItem('authToken');
if (token) {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
}

// Toggle between login and register forms
document.getElementById('show-register').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('register-section').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('register-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
});

// Registration form handler
document.getElementById('register-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const confirmPassword = document.getElementById('register-confirm-password').value.trim();
  const errorDiv = document.getElementById('register-error');

  if (!username || !password || !confirmPassword) {
    errorDiv.textContent = 'All fields are required.';
    return;
  }

  if (password !== confirmPassword) {
    errorDiv.textContent = 'Passwords do not match.';
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = 'Password must be at least 6 characters long.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.username);
      document.getElementById('auth-container').style.display = 'none';
      document.getElementById('app-container').style.display = 'block';
      errorDiv.textContent = '';
    } else {
      errorDiv.textContent = data.error || 'Registration failed.';
    }
  } catch (err) {
    errorDiv.textContent = 'Network error. Please try again.';
  }
});

// Login form handler
document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errorDiv = document.getElementById('login-error');

  if (!username || !password) {
    errorDiv.textContent = 'Username and password are required.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.username);
      document.getElementById('auth-container').style.display = 'none';
      document.getElementById('app-container').style.display = 'block';
      errorDiv.textContent = '';
    } else {
      errorDiv.textContent = data.error || 'Login failed.';
    }
  } catch (err) {
    errorDiv.textContent = 'Network error. Please try again.';
  }
});

document.getElementById('chat-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const question = document.getElementById('chat-input').value.trim();
  if (!question) return;
  const responseDiv = document.getElementById('chat-response');
  responseDiv.innerHTML = '<em>Loading...</em>';
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ question }),
    });

    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      document.getElementById('auth-container').style.display = 'block';
      document.getElementById('app-container').style.display = 'none';
      return;
    }

    const data = await response.json();

    responseDiv.innerHTML = `<div><strong>Answer:</strong> ${data.answer}</div><div><strong>Explanation:</strong> ${data.explanation}</div>`;
    if (data.videos && data.videos.length > 0) {
      responseDiv.innerHTML += '<div><strong>YouTube Videos:</strong><ul>' +
        data.videos.map(v => `<li><a href="${v.url}" target="_blank">${v.title}</a></li>`).join('') + '</ul></div>';
    }
  } catch (err) {
    responseDiv.innerHTML = '<span style="color:red">Error fetching answer.</span>';
  }
});

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', function() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
  document.getElementById('auth-container').style.display = 'block';
  document.getElementById('app-container').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('register-section').style.display = 'none';
});