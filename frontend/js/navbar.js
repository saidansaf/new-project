import { api } from './api.js';
import { isAuthenticated, clearTokens } from './auth.js';
import { applyI18n, getLang, LANGUAGES, setLang, t } from './i18n.js';
import { getTheme, toggleTheme } from './theme.js';

export async function renderNavbar(activePage = '') {
  const container = document.getElementById('navbar');
  if (!container) return null;

  let user = null;
  if (isAuthenticated()) {
    try {
      user = await api.get('/api/auth/me/', { auth: true });
    } catch {
      clearTokens();
    }
  }

  container.innerHTML = `
    <nav class="navbar">
      <a href="index.html" class="navbar-brand">🎓 ${t('brand')}</a>
      <div class="navbar-auth">
        ${
          user
            ? `
               ${user.current_streak > 0 ? `<span class="navbar-streak" title="Streak">🔥 ${user.current_streak}</span>` : ''}
               <div class="bell-wrap">
                 <button class="bell-btn" id="bellBtn" title="${t('notifications')}" type="button">
                   🔔<span id="bellBadge" class="bell-badge" hidden>0</span>
                 </button>
                 <div id="bellDropdown" class="bell-dropdown" hidden></div>
               </div>
               <div class="avatar-wrap">
                 <button id="avatarBtn" class="navbar-avatar" type="button" title="${escapeHtml(user.username)}">
                   ${user.avatar ? `<img src="${user.avatar}" alt="avatar" />` : escapeHtml((user.username || '?').charAt(0).toUpperCase())}
                 </button>
                 <div id="avatarDropdown" class="avatar-dropdown" hidden>
                   <div class="avatar-dropdown-header">
                     <div class="navbar-avatar navbar-avatar-lg">
                       ${user.avatar ? `<img src="${user.avatar}" alt="avatar" />` : escapeHtml((user.username || '?').charAt(0).toUpperCase())}
                     </div>
                     <div>
                       <div class="avatar-dropdown-name">${escapeHtml(user.first_name || user.username)}</div>
                     </div>
                   </div>
                   <a href="dashboard.html" class="avatar-menu-item">👤 ${t('profile')}</a>
                   <div class="avatar-menu-item lang-item">
                     <span>🌐 ${t('language')}</span>
                     <div class="lang-buttons">
                       ${LANGUAGES.map((l) => `<button type="button" class="lang-btn ${getLang() === l.code ? 'active' : ''}" data-lang="${l.code}">${l.code.toUpperCase()}</button>`).join('')}
                     </div>
                   </div>
                   <button id="themeToggleBtn" type="button" class="avatar-menu-item">
                     <span id="themeToggleLabel">${getTheme() === 'dark' ? '☀️ ' + t('light_mode') : '🌙 ' + t('dark_mode')}</span>
                   </button>
                   <button id="logoutBtn" type="button" class="avatar-menu-item avatar-menu-danger">🚪 ${t('logout')}</button>
                 </div>
               </div>`
            : `<a href="login.html" class="nav-link ${activePage === 'login' ? 'active' : ''}">${t('login')}</a>
               <a href="register.html" class="btn btn-primary btn-sm">${t('register')}</a>`
        }
      </div>
    </nav>
  `;

  if (user) {
    bindAvatarDropdown();
    bindBell();
    loadUnreadCount();
  }

  renderSidebar(activePage, user);
  applyI18n();

  return user;
}

function bindAvatarDropdown() {
  const btn = document.getElementById('avatarBtn');
  const dropdown = document.getElementById('avatarDropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
    document.getElementById('bellDropdown')?.setAttribute('hidden', '');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.hidden && !dropdown.contains(e.target) && e.target !== btn) {
      dropdown.hidden = true;
    }
  });

  dropdown.querySelectorAll('.lang-btn').forEach((langBtn) => {
    langBtn.addEventListener('click', () => setLang(langBtn.dataset.lang));
  });

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    const nowTheme = toggleTheme();
    const label = document.getElementById('themeToggleLabel');
    if (label) label.textContent = nowTheme === 'dark' ? '☀️ ' + t('light_mode') : '🌙 ' + t('dark_mode');
  });

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', () => {
    clearTokens();
    window.location.href = 'index.html';
  });
}

function bindBell() {
  const btn = document.getElementById('bellBtn');
  const dropdown = document.getElementById('bellDropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const willOpen = dropdown.hidden;
    dropdown.hidden = !willOpen;
    document.getElementById('avatarDropdown')?.setAttribute('hidden', '');
    if (willOpen) await loadBellPanel();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.hidden && !dropdown.contains(e.target) && e.target !== btn) {
      dropdown.hidden = true;
    }
  });
}

function groupByDate(items) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups = { BUGUN: [], KECHA: [], OLDINROQ: [] };

  items.forEach((n) => {
    const d = new Date(n.created_at).toDateString();
    if (d === today) groups.BUGUN.push(n);
    else if (d === yesterday) groups.KECHA.push(n);
    else groups.OLDINROQ.push(n);
  });
  return groups;
}

function notificationItemHtml(n) {
  const time = new Date(n.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  const icon = n.message.includes('sertifikat') ? '🎓' : n.message.includes('streak') || n.message.includes('seriya') ? '🔥' : '🔔';
  return `
    <div class="notif-item ${n.is_read ? '' : 'unread'}">
      <span class="notif-icon">${icon}</span>
      <div class="notif-body">
        <div class="notif-text">${escapeHtml(n.message)}</div>
        <div class="notif-time">${time}</div>
      </div>
      ${!n.is_read ? '<span class="notif-dot"></span>' : ''}
    </div>
  `;
}

let bellFilter = 'all';

async function loadBellPanel() {
  const dropdown = document.getElementById('bellDropdown');
  dropdown.innerHTML = `<p class="muted" style="padding:16px;">Yuklanmoqda...</p>`;
  try {
    const data = await api.get('/api/notifications/', { auth: true });
    const all = data.results ?? data;
    renderBellPanel(all);
  } catch {
    dropdown.innerHTML = `<p class="muted" style="padding:16px;">Yuklab bo'lmadi.</p>`;
  }
}

function renderBellPanel(all) {
  const dropdown = document.getElementById('bellDropdown');
  const unreadCount = all.filter((n) => !n.is_read).length;
  const items = bellFilter === 'unread' ? all.filter((n) => !n.is_read) : all;
  const groups = groupByDate(items.slice(0, 30));

  const sectionHtml = (label, list) => list.length
    ? `<div class="notif-section-label">${label}</div>${list.map(notificationItemHtml).join('')}`
    : '';

  dropdown.innerHTML = `
    <div class="notif-header">
      <span>${t('notifications')}</span>
      <button id="markAllReadBtn" class="notif-mark-all" type="button">✓ ${t('mark_all_read')}</button>
    </div>
    <div class="notif-tabs">
      <button type="button" class="notif-tab ${bellFilter === 'all' ? 'active' : ''}" data-filter="all">${t('all')}</button>
      <button type="button" class="notif-tab ${bellFilter === 'unread' ? 'active' : ''}" data-filter="unread">${t('unread')} · ${unreadCount}</button>
    </div>
    <div class="notif-list">
      ${
        items.length
          ? sectionHtml('BUGUN', groups.BUGUN) + sectionHtml('KECHA', groups.KECHA) + sectionHtml('OLDINROQ', groups.OLDINROQ)
          : `<p class="muted" style="padding:16px;">${t('no_notifications')}</p>`
      }
    </div>
  `;

  dropdown.querySelectorAll('.notif-tab').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      bellFilter = tabBtn.dataset.filter;
      renderBellPanel(all);
    });
  });

  document.getElementById('markAllReadBtn')?.addEventListener('click', async () => {
    const unread = all.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => api.patch(`/api/notifications/${n.id}/read/`, {}, { auth: true }).catch(() => null)));
    loadBellPanel();
    loadUnreadCount();
  });
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

function renderSidebar(activePage, user) {
  const sidebarEl = document.getElementById('sidebar');
  if (!sidebarEl) return;

  const isInstructor = user && (user.role === 'instructor' || user.role === 'admin');
  const link = (href, icon, label, key) =>
    `<a href="${href}" class="sidebar-link ${activePage === key ? 'active' : ''}">${icon} <span>${label}</span></a>`;

  sidebarEl.innerHTML = `
    <div class="sidebar-inner">
      ${link('index.html', '📚', t('courses'), 'courses')}
      ${link('typing-test.html', '⌨️', t('typing'), 'typing')}
      ${user ? link('dashboard.html', '🏠', t('dashboard'), 'dashboard') : ''}
      ${user ? link('wishlist.html', '♥', t('wishlist_nav'), 'wishlist') : ''}
      ${user ? link('payments.html', '💳', t('payments_nav'), 'payments') : ''}
      ${isInstructor ? link('create-course.html', '➕', t('create_course'), 'create-course') : ''}
      ${isInstructor ? link('instructor-stats.html', '📊', t('instructor_stats_nav'), 'instructor-stats') : ''}
      ${user && user.is_staff ? link('admin-panel.html', '🛡️', t('admin'), 'admin') : ''}
    </div>
  `;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
