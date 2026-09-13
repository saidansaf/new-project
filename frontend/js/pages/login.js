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

    let redirectTo = 'dashboard.html';
    try {
      const me = await api.get('/api/auth/me/', { auth: true });
      if (me.is_staff) redirectTo = 'admin-panel.html';
    } catch {
      // profil olinmasa ham oddiy dashboard'ga yuboraveramiz
    }
    window.location.href = redirectTo;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      showError("Login yoki parol noto'g'ri.");
    } else if (err instanceof ApiError) {
      showError(err.message);
    } else {
      showError("Serverga ulanib bo'lmadi (server sekin uyg'onayotgan bo'lishi mumkin). Birozdan so'ng qayta urinib ko'ring.");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Kirish';
  }
});
