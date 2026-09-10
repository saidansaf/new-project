import { api, ApiError } from '../api.js';
import { setTokens, isAuthenticated } from '../auth.js';
import { renderNavbar } from '../navbar.js';

renderNavbar('register');

if (isAuthenticated()) {
  window.location.href = 'dashboard.html';
}

const form = document.getElementById('registerForm');
const alertBox = document.getElementById('alertBox');
const submitBtn = document.getElementById('submitBtn');

function showError(message) {
  alertBox.innerHTML = `<div class="alert alert-error">${message}</div>`;
}

function formatErrors(data) {
  if (!data || typeof data !== 'object') return "Ro'yxatdan o'tishda xatolik.";
  return Object.entries(data)
    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
    .join('<br>');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.innerHTML = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Yuborilmoqda...';

  const payload = {
    first_name: document.getElementById('firstName').value.trim(),
    last_name: document.getElementById('lastName').value.trim(),
    username: document.getElementById('username').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
    role: document.getElementById('role').value,
  };

  try {
    await api.post('/api/auth/register/', payload);
    // Ro'yxatdan o'tgach avtomatik login qilamiz
    const loginData = await api.post('/api/auth/login/', {
      username: payload.username,
      password: payload.password,
    });
    setTokens(loginData.access, loginData.refresh);
    window.location.href = 'dashboard.html';
  } catch (err) {
    if (err instanceof ApiError) {
      showError(formatErrors(err.data));
    } else {
      showError('Xatolik yuz berdi: ' + err.message);
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Ro'yxatdan o'tish";
  }
});
