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
        ${user && user.is_staff ? link('admin-panel.html', 'Admin', 'admin') : ''}
      </div>
      <div class="navbar-auth">
        ${
          user
            ? `
               ${user.current_streak > 0 ? `<span class="navbar-streak" title="Kunlik streak">🔥 ${user.current_streak}</span>` : ''}
               <a href="dashboard.html" class="bell-btn" id="bellBtn" title="Bildirishnomalar">
                 🔔<span id="bellBadge" class="bell-badge" hidden>0</span>
               </a>
               <span class="navbar-user">👤 ${escapeHtml(user.username)}</span>
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

  if (user) loadUnreadCount();

  return user;
}

async function loadUnreadCount() {
  try {
    const data = await api.get('/api/notifications/', { auth: true });
    const items = data.results ?? data;
    const unread = items.filter((n) => !n.is_read).length;
    const badge = document.getElementById('bellBadge');
    if (badge && unread > 0) {
      badge.textContent = unread > 9 ? '9+' : String(unread);
      badge.hidden = false;
    }
  } catch {
    // jim o'tkazamiz — bildirishnoma sonini ko'rsata olmasak ham sayt ishlayveradi
  }
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
