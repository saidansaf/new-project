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
      document.getElementById('tabCoupons').hidden = tab.dataset.tab !== 'coupons';
    });
  });
}

function couponRowHtml(c) {
  const expired = c.expires_at && new Date(c.expires_at) < new Date();
  const maxedOut = c.max_uses && c.used_count >= c.max_uses;
  const active = c.is_active && !expired && !maxedOut;
  return `
    <tr>
      <td><strong>${escapeHtml(c.code)}</strong></td>
      <td>${c.discount_percent}%</td>
      <td>${c.used_count}${c.max_uses ? ' / ' + c.max_uses : ''}</td>
      <td class="${active ? 'status-active' : 'status-blocked'}">${active ? 'Faol' : 'Faol emas'}</td>
      <td><button class="btn btn-outline btn-sm toggle-coupon-btn" data-id="${c.id}" data-active="${c.is_active}">${c.is_active ? 'O\'chirish' : 'Yoqish'}</button></td>
    </tr>
  `;
}

async function loadCoupons() {
  const el = document.getElementById('couponsTable');
  try {
    const data = await api.get('/api/admin-panel/coupons/', { auth: true });
    const coupons = data.results ?? data;
    el.innerHTML = coupons.length
      ? `
        <table class="data-table">
          <thead><tr><th>Kod</th><th>Chegirma</th><th>Ishlatilgan</th><th>Holat</th><th>Amal</th></tr></thead>
          <tbody>${coupons.map(couponRowHtml).join('')}</tbody>
        </table>
      `
      : '<p class="muted">Hali chegirma kodlari yo\'q.</p>';

    el.querySelectorAll('.toggle-coupon-btn').forEach((btn) => {
      btn.addEventListener('click', () => toggleCoupon(btn.dataset.id, btn.dataset.active === 'true'));
    });
  } catch {
    el.innerHTML = '<p class="muted">Chegirma kodlarini yuklab bo\'lmadi.</p>';
  }
}

async function toggleCoupon(id, isActive) {
  try {
    await api.patch(`/api/admin-panel/coupons/${id}/`, { is_active: !isActive }, { auth: true });
    loadCoupons();
  } catch {
    showAlert('error', 'Yangilashda xatolik.');
  }
}

function bindCouponForm() {
  document.getElementById('couponForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const discount_percent = Number(document.getElementById('couponPercent').value);
    const maxUsesRaw = document.getElementById('couponMaxUses').value;

    try {
      await api.post('/api/admin-panel/coupons/', {
        code,
        discount_percent,
        max_uses: maxUsesRaw ? Number(maxUsesRaw) : null,
      }, { auth: true });
      showAlert('success', 'Chegirma kodi qo\'shildi.');
      document.getElementById('couponForm').reset();
      loadCoupons();
    } catch (err) {
      showAlert('error', err instanceof ApiError ? err.message : "Qo'shishda xatolik.");
    }
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
  bindCouponForm();
  loadStats();
  loadUsers();
  loadPendingCourses();
  loadCoupons();
}

init();
