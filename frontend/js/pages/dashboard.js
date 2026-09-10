import { api } from '../api.js';
import { requireAuth } from '../auth.js';
import { renderNavbar, escapeHtml } from '../navbar.js';

if (!requireAuth()) {
  throw new Error('not authenticated');
}

const ROLE_LABEL = { student: 'Talaba', instructor: "O'qituvchi", admin: 'Admin' };

function showAlert(type, message) {
  const box = document.getElementById('alertBox');
  box.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { box.innerHTML = ''; }, 4000);
}

function renderProfile(user) {
  document.getElementById('profilePanel').innerHTML = `
    <h3>👤 Profil</h3>
    <div class="list-item"><span>Foydalanuvchi</span><strong>${escapeHtml(user.username)}</strong></div>
    <div class="list-item"><span>Email</span><strong>${escapeHtml(user.email)}</strong></div>
    <div class="list-item"><span>Rol</span><span class="badge">${ROLE_LABEL[user.role] || user.role}</span></div>
    ${user.phone ? `<div class="list-item"><span>Telefon</span><strong>${escapeHtml(user.phone)}</strong></div>` : ''}
    <div class="list-item"><span>🔥 Kunlik streak</span><strong>${user.current_streak} kun</strong></div>
    <div class="list-item"><span>🏆 Eng uzun streak</span><strong>${user.longest_streak} kun</strong></div>
  `;
}

async function loadMyCourses() {
  const el = document.getElementById('myCourses');
  try {
    const enrollments = await api.get('/api/enrollments/my/', { auth: true });
    if (!enrollments.length) {
      el.innerHTML = '<div class="empty-state">Hali hech qanday kursga yozilmagansiz. <a href="index.html">Kurslarni ko\'rish →</a></div>';
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
    el.innerHTML = '<p class="muted">Kurslarni yuklab bo\'lmadi.</p>';
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
      : '<p class="muted">Hozircha bildirishnoma yo\'q.</p>';
  } catch {
    el.innerHTML = '<p class="muted">Bildirishnomalarni yuklab bo\'lmadi.</p>';
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
            ${c.file ? `<a href="${c.file}" target="_blank" class="btn btn-outline btn-sm">Yuklab olish</a>` : '<span class="muted">Tayyorlanmoqda...</span>'}
          </div>
        `).join('')
      : '<p class="muted">Hali sertifikatlaringiz yo\'q. Kursni 100% tugating!</p>';
  } catch {
    el.innerHTML = '<p class="muted">Sertifikatlarni yuklab bo\'lmadi.</p>';
  }
}

function bindTelegramLink() {
  document.getElementById('telegramLinkBtn').addEventListener('click', async () => {
    try {
      const data = await api.post('/api/telegram/link-token/', {}, { auth: true });
      document.getElementById('telegramLinkResult').innerHTML = `
        <div class="alert alert-info" style="margin-top:12px;">
          Telegramda ochish uchun tugmani bosing (havola 1 marta ishlaydi):<br>
          <a href="${data.deep_link}" target="_blank" class="btn btn-primary btn-block" style="margin-top:8px;">
            📲 Telegram botni ochish
          </a>
        </div>
      `;
    } catch {
      showAlert('error', "Havola yaratishda xatolik yuz berdi.");
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
