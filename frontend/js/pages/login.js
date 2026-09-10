import { api, ApiError } from '../api.js';
import { setTokens, isAuthenticated } from '../auth.js';
import { renderNavbar } from '../navbar.js';

renderNavbar('login');

if (isAuthenticated()) {
  window.location.href = 'dashboard.html';
}

const form = document.getElementById('loginForm');
const alertBox = document.getElementById('alertBox');
const submitBtn = document.getElementById('submitBtn');

function showError(message) {
  alertBox.innerHTML = `<div class="alert alert-error">${message}</div>`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.innerHTML = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Kirilmoqda...';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const data = await api.post('/api/auth/login/', { username, password });
    setTokens(data.access, data.refresh);
    window.location.href = 'dashboard.html';
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      showError("Login yoki parol noto'g'ri.");
    } else {
      showError('Xatolik yuz berdi: ' + err.message);
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Kirish';
  }
});
