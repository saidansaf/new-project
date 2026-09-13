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

if (new URLSearchParams(window.location.search).get('ref')) {
  alertBox.innerHTML = '<div class="alert alert-info">🤝 Do\'stingiz taklifi orqali keldingiz!</div>';
}

const NETWORK_ERROR_MESSAGE =
  "Serverga ulanib bo'lmadi (server sekin uyg'onayotgan bo'lishi mumkin). Internetni tekshirib, birozdan so'ng qayta urinib ko'ring.";

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

  const refCode = new URLSearchParams(window.location.search).get('ref') || '';

  const payload = {
    first_name: document.getElementById('firstName').value.trim(),
    last_name: document.getElementById('lastName').value.trim(),
    username: document.getElementById('username').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
    role: document.getElementById('role').value,
    referral_code: refCode,
  };

  try {
    await api.post('/api/auth/register/', payload);
  } catch (registerErr) {
    if (registerErr instanceof ApiError) {
      showError(formatErrors(registerErr.data));
      submitBtn.disabled = false;
      submitBtn.textContent = "Ro'yxatdan o'tish";
      return;
    }
    // Tarmoq xatosi (masalan "Failed to fetch") — server so'rovni aslida qabul qilib,
    // akkauntni yaratgan bo'lishi mumkin, faqat javob mijozga yetib kelmagan. Buni
    // aniqlashning yagona xavfsiz yo'li — login bilan tekshirib ko'rish (pastda).
  }

  try {
    const loginData = await api.post('/api/auth/login/', {
      username: payload.username,
      password: payload.password,
    });
    setTokens(loginData.access, loginData.refresh);
    window.location.href = 'dashboard.html';
    return;
  } catch {
    // Ikkala urinish ham muvaffaqiyatsiz bo'lsa — bu login/parol xatosi emas
    // (chunki parolni biz o'zimiz yubordik), balki server bilan haqiqiy muammo.
    showError(NETWORK_ERROR_MESSAGE);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Ro'yxatdan o'tish";
  }
});
