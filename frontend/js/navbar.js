import { api } from './api.js';
import { isAuthenticated, clearTokens } from './auth.js';

export async function renderNavbar(activePage = '') {
  const container = document.getElementById('navbar');
  if (!container) return;

  let user = null;
  if (isAuthenticated()) {
    try {
      user = await api.get('/api/auth/me/', { auth: true });
    } catch {
      clearTokens();
    }
  }

  const link = (href, label, key) =>
    `<a href="${href}" class="nav-link ${activePage === key ? 'active' : ''}">${label}</a>`;

  const isInstructor = user && (user.role === 'instructor' || user.role === 'admin');

  container.innerHTML = `
    <nav class="navbar">
      <a href="index.html" class="navbar-brand">🎓 EduNest</a>
      <div class="navbar-links">
        ${link('index.html', 'Kurslar', 'courses')}
        ${user ? link('dashboard.html', 'Dashboard', 'dashboard') : ''}
        ${isInstructor ? link('create-course.html', 'Kurs yaratish', 'create-course') : ''}
      </div>
      <div class="navbar-auth">
        ${
          user
            ? `<span class="navbar-user">👤 ${escapeHtml(user.username)}</span>
               <button id="logoutBtn" class="btn btn-ghost btn-sm">Chiqish</button>`
            : `${link('login.html', 'Kirish', 'login')}
               <a href="register.html" class="btn btn-primary btn-sm">Ro'yxatdan o'tish</a>`
        }
      </div>
    </nav>
  `;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearTokens();
      window.location.href = 'index.html';
    });
  }

  return user;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
