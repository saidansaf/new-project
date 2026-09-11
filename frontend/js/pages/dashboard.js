import { api } from '../api.js';
import { requireAuth } from '../auth.js';
import { t } from '../i18n.js';
import { escapeHtml, renderNavbar } from '../navbar.js';

if (!requireAuth()) {
  throw new Error('not authenticated');
}

function roleLabel(role) {
  return { student: t('role_student'), instructor: t('role_instructor'), admin: 'Admin' }[role] || role;
}

function showAlert(type, message) {
  const box = document.getElementById('alertBox');
  box.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { box.innerHTML = ''; }, 4000);
}

function renderProfile(user) {
  document.getElementById('profilePanel').innerHTML = `
    <h3>${t('profile_title')}</h3>
    <div class="list-item"><span>${t('field_user')}</span><strong>${escapeHtml(user.username)}</strong></div>
    <div class="list-item"><span>${t('field_email')}</span><strong>${escapeHtml(user.email)}</strong></div>
    <div class="list-item"><span>${t('field_role')}</span><span class="badge">${roleLabel(user.role)}</span></div>
    ${user.phone ? `<div class="list-item"><span>${t('field_phone')}</span><strong>${escapeHtml(user.phone)}</strong></div>` : ''}
    <div class="list-item"><span>${t('streak_daily')}</span><strong>${user.current_streak} ${t('days_suffix')}</strong></div>
    <div class="list-item"><span>${t('streak_longest')}</span><strong>${user.longest_streak} ${t('days_suffix')}</strong></div>
  `;
}

async function loadMyCourses() {
  const el = document.getElementById('myCourses');
  try {
    const enrollments = await api.get('/api/enrollments/my/', { auth: true });
    if (!enrollments.length) {
      el.innerHTML = `<div class="empty-state">${t('no_enrollments')} <a href="index.html">${t('view_courses')}</a></div>`;
      return;
    }
    el.innerHTML = enrollments.map((e) => `
      <div class="list-item" style="flex-direction:column;align-items:stretch;gap:6px;">
        <div style="display:flex;justify-content:space-between;">
          <a href="course.html?id=${e.course}"><strong>${escapeHtml(e.course_title)}</strong></a>
          <span class="muted">${e.progress_percent}%</span>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${e.progress_percent}%"></div></div>
      </div>
    `).join('');
  } catch {
    el.innerHTML = `<p class="muted">${t('courses_load_error')}</p>`;
  }
}

async function loadNotifications() {
  const el = document.getElementById('notificationsList');
  try {
    const data = await api.get('/api/notifications/', { auth: true });
    const items = data.results ?? data;
    el.innerHTML = items.length
      ? items.slice(0, 8).map((n) => `
          <div class="list-item">
            <span>${n.is_read ? '' : '🔵 '}${escapeHtml(n.message)}</span>
            <span class="muted">${new Date(n.created_at).toLocaleDateString('uz-UZ')}</span>
          </div>
        `).join('')
      : `<p class="muted">${t('no_notifications_yet')}</p>`;
  } catch {
    el.innerHTML = `<p class="muted">${t('notif_load_error')}</p>`;
  }
}

async function loadCertificates() {
  const el = document.getElementById('certificatesList');
  try {
    const data = await api.get('/api/certificates/', { auth: true });
    const items = data.results ?? data;
    el.innerHTML = items.length
      ? items.map((c) => `
          <div class="list-item">
            <span>🎓 ${escapeHtml(c.course_title)}</span>
            ${c.file ? `<a href="${c.file}" target="_blank" class="btn btn-outline btn-sm">${t('download')}</a>` : `<span class="muted">${t('preparing')}</span>`}
          </div>
        `).join('')
      : `<p class="muted">${t('no_certificates')}</p>`;
  } catch {
    el.innerHTML = `<p class="muted">${t('cert_load_error')}</p>`;
  }
}

function bindTelegramLink() {
  document.getElementById('telegramLinkBtn').addEventListener('click', async () => {
    try {
      const data = await api.post('/api/telegram/link-token/', {}, { auth: true });
      document.getElementById('telegramLinkResult').innerHTML = `
        <div class="alert alert-info" style="margin-top:12px;">
          ${t('telegram_open_hint')}<br>
          <a href="${data.deep_link}" target="_blank" class="btn btn-primary btn-block" style="margin-top:8px;">
            ${t('telegram_open_btn')}
          </a>
        </div>
      `;
    } catch {
      showAlert('error', t('telegram_link_error'));
    }
  });
}

async function init() {
  const user = await renderNavbar('dashboard');
  if (!user) return;
  renderProfile(user);
  bindTelegramLink();
  loadMyCourses();
  loadNotifications();
  loadCertificates();
}

init();
