import { api, ApiError } from '../api.js';
import { clearTokens, requireAuth } from '../auth.js';
import { escapeHtml } from '../navbar.js';

if (!requireAuth()) {
  throw new Error('not authenticated');
}

const alertBox = document.getElementById('alertBox');

function showAlert(type, message) {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { alertBox.innerHTML = ''; }, 4000);
}

const STAT_LABELS = {
  total_users: 'Foydalanuvchilar',
  total_students: 'Talabalar',
  total_instructors: "O'qituvchilar",
  blocked_users: 'Bloklangan',
  total_courses: 'Kurslar',
  pending_courses: 'Tasdiq kutmoqda',
  total_enrollments: "Ro'yxatdan o'tishlar",
  total_certificates: 'Sertifikatlar',
};

async function loadStats() {
  try {
    const stats = await api.get('/api/admin-panel/stats/', { auth: true });
    document.getElementById('statsGrid').innerHTML = Object.entries(STAT_LABELS).map(([key, label]) => `
      <div class="stat-card">
        <div class="value">${stats[key] ?? 0}</div>
        <div class="label">${label}</div>
      </div>
    `).join('');
  } catch (err) {
    showAlert('error', "Statistikani yuklab bo'lmadi.");
  }
}

async function loadUsers() {
  const el = document.getElementById('tabUsers');
  try {
    const data = await api.get('/api/admin-panel/users/', { auth: true });
    const users = data.results ?? data;
    el.innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>Username</th><th>Email</th><th>Rol</th><th>Holat</th><th>Amal</th></tr>
        </thead>
        <tbody>
          ${users.map((u) => `
            <tr>
              <td>${escapeHtml(u.username)}</td>
              <td>${escapeHtml(u.email)}</td>
              <td>${escapeHtml(u.role)}${u.is_staff ? ' 🛡️' : ''}</td>
              <td class="${u.is_active ? 'status-active' : 'status-blocked'}">${u.is_active ? 'Faol' : 'Bloklangan'}</td>
              <td>
                ${u.is_staff
                  ? '<span class="muted">—</span>'
                  : `<button class="btn btn-outline btn-sm toggle-block-btn" data-id="${u.id}" data-active="${u.is_active}">${u.is_active ? 'Bloklash' : 'Ochirish'}</button>`}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    el.querySelectorAll('.toggle-block-btn').forEach((btn) => {
      btn.addEventListener('click', () => toggleBlock(btn.dataset.id));
    });
  } catch {
    el.innerHTML = '<p class="muted">Foydalanuvchilarni yuklab bo\'lmadi.</p>';
  }
}

async function toggleBlock(userId) {
  try {
    await api.patch(`/api/admin-panel/users/${userId}/toggle-block/`, {}, { auth: true });
    showAlert('success', 'Holat yangilandi.');
    loadUsers();
    loadStats();
  } catch (err) {
    showAlert('error', err instanceof ApiError ? err.message : 'Xatolik yuz berdi.');
  }
}

async function loadPendingCourses() {
  const el = document.getElementById('tabCourses');
  try {
    const data = await api.get('/api/admin-panel/courses/pending/', { auth: true });
    const courses = data.results ?? data;
    el.innerHTML = courses.length
      ? `
        <table class="data-table">
          <thead><tr><th>Nomi</th><th>O'qituvchi</th><th>Amal</th></tr></thead>
          <tbody>
            ${courses.map((c) => `
              <tr>
                <td>${escapeHtml(c.title)}</td>
                <td>${escapeHtml(c.instructor_name)}</td>
                <td><button class="btn btn-primary btn-sm approve-btn" data-id="${c.id}">Tasdiqlash</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '<p class="muted">Tasdiqlash kutayotgan kurslar yo\'q.</p>';

    el.querySelectorAll('.approve-btn').forEach((btn) => {
      btn.addEventListener('click', () => approveCourse(btn.dataset.id));
    });
  } catch {
    el.innerHTML = '<p class="muted">Kurslarni yuklab bo\'lmadi.</p>';
  }
}

async function approveCourse(courseId) {
  try {
    await api.patch(`/api/admin-panel/courses/${courseId}/approve/`, {}, { auth: true });
    showAlert('success', 'Kurs tasdiqlandi.');
    loadPendingCourses();
    loadStats();
  } catch {
    showAlert('error', 'Tasdiqlashda xatolik.');
  }
}

function bindTabs() {
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tabUsers').hidden = tab.dataset.tab !== 'users';
      document.getElementById('tabCourses').hidden = tab.dataset.tab !== 'courses';
    });
  });
}

async function init() {
  let me;
  try {
    me = await api.get('/api/auth/me/', { auth: true });
  } catch {
    window.location.href = 'login.html';
    return;
  }
  if (!me.is_staff) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearTokens();
    window.location.href = 'index.html';
  });

  bindTabs();
  loadStats();
  loadUsers();
  loadPendingCourses();
}

init();
