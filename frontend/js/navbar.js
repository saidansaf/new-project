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
        ${link('typing-test.html', '⌨️ Typing', 'typing')}
        ${user ? link('dashboard.html', 'Dashboard', 'dashboard') : ''}
        ${isInstructor ? link('create-course.html', 'Kurs yaratish', 'create-course') : ''}
        ${user && user.is_staff ? link('admin-panel.html', 'Admin', 'admin') : ''}
      </div>
      <div class="navbar-auth">
        ${
          user
            ? `
               ${user.current_streak > 0 ? `<span class="navbar-streak" title="Kunlik streak">🔥 ${user.current_streak}</span>` : ''}
               <div class="bell-wrap">
                 <button class="bell-btn" id="bellBtn" title="Bildirishnomalar" type="button">
                   🔔<span id="bellBadge" class="bell-badge" hidden>0</span>
                 </button>
                 <div id="bellDropdown" class="bell-dropdown" hidden>
                   <div class="bell-dropdown-title">Bildirishnomalar</div>
                   <div id="bellList"><p class="muted" style="padding:12px;">Yuklanmoqda...</p></div>
                   <a href="dashboard.html" class="bell-dropdown-footer">Barchasini ko'rish →</a>
                 </div>
               </div>
               <a href="dashboard.html" class="navbar-avatar" title="${escapeHtml(user.username)}">
                 ${user.avatar ? `<img src="${user.avatar}" alt="avatar" />` : escapeHtml((user.username || '?').charAt(0).toUpperCase())}
               </a>
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

  if (user) {
    bindBell();
    loadUnreadCount();
  }

  return user;
}

function bindBell() {
  const btn = document.getElementById('bellBtn');
  const dropdown = document.getElementById('bellDropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const willOpen = dropdown.hidden;
    dropdown.hidden = !willOpen;
    if (willOpen) await loadBellList();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.hidden && !dropdown.contains(e.target) && e.target !== btn) {
      dropdown.hidden = true;
    }
  });
}

async function loadBellList() {
  const listEl = document.getElementById('bellList');
  try {
    const data = await api.get('/api/notifications/', { auth: true });
    const items = (data.results ?? data).slice(0, 6);
    listEl.innerHTML = items.length
      ? items.map((n) => `
          <div class="bell-item ${n.is_read ? '' : 'unread'}">
            <div>${escapeHtml(n.message)}</div>
            <div class="bell-item-date">${new Date(n.created_at).toLocaleDateString('uz-UZ')}</div>
          </div>
        `).join('')
      : '<p class="muted" style="padding:12px;">Hozircha bildirishnoma yo\'q.</p>';
  } catch {
    listEl.innerHTML = '<p class="muted" style="padding:12px;">Yuklab bo\'lmadi.</p>';
  }
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
