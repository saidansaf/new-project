import { api, ApiError } from '../api.js';
import { isAuthenticated } from '../auth.js';
import { renderNavbar, escapeHtml } from '../navbar.js';

const courseId = new URLSearchParams(window.location.search).get('id');
const alertBox = document.getElementById('alertBox');

if (!courseId) {
  alertBox.innerHTML = '<div class="alert alert-error">Kurs ID ko\'rsatilmagan.</div>';
  throw new Error('missing course id');
}

let currentUser = null;
let currentEnrollment = null;

const LEVEL_LABEL = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' };

function showAlert(type, message) {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { alertBox.innerHTML = ''; }, 4000);
}

async function findMyEnrollment() {
  if (!isAuthenticated()) return null;
  try {
    const list = await api.get('/api/enrollments/my/', { auth: true });
    return (list || []).find((e) => String(e.course) === String(courseId)) || null;
  } catch {
    return null;
  }
}

function renderHeader(course) {
  const price = Number(course.price) === 0 ? "Bepul" : `${course.price} so'm`;
  const rating = course.average_rating ? `⭐ ${course.average_rating}` : "Hali baholanmagan";

  let actionHtml;
  if (!isAuthenticated()) {
    actionHtml = `<a href="login.html" class="btn btn-primary btn-block">Kirib ro'yxatdan o'tish</a>`;
  } else if (currentEnrollment) {
    const pct = currentEnrollment.progress_percent;
    actionHtml = `
      <div class="badge">✅ Siz ro'yxatdan o'tgansiz</div>
      <div class="progress-bar" style="margin-top:8px;"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <div class="muted" style="margin-top:4px;">Progress: ${pct}%</div>
      ${pct < 100 ? `<button id="progressBtn" class="btn btn-outline btn-block" style="margin-top:10px;">+25% progress</button>` : ''}
    `;
  } else {
    actionHtml = `<button id="enrollBtn" class="btn btn-primary btn-block">Kursga yozilish (${price})</button>`;
  }

  document.getElementById('courseHeader').innerHTML = `
    <div class="course-header-info">
      <span class="badge level-${course.level}">${LEVEL_LABEL[course.level] || course.level}</span>
      ${course.category_name ? `<span class="badge">${escapeHtml(course.category_name)}</span>` : ''}
      <h1>${escapeHtml(course.title)}</h1>
      <div class="card-meta">👨‍🏫 ${escapeHtml(course.instructor_name || '')} &nbsp;•&nbsp; ${rating}</div>
    </div>
    <div class="course-actions">
      <div class="price" style="font-size:22px;">${price}</div>
      ${actionHtml}
    </div>
  `;

  document.getElementById('courseDescription').innerHTML = `<p>${escapeHtml(course.description || '')}</p>`;

  const enrollBtn = document.getElementById('enrollBtn');
  if (enrollBtn) enrollBtn.addEventListener('click', () => enroll(course));

  const progressBtn = document.getElementById('progressBtn');
  if (progressBtn) progressBtn.addEventListener('click', () => bumpProgress(course));
}

async function enroll(course) {
  try {
    await api.post('/api/enrollments/', { course: course.id }, { auth: true });
    showAlert('success', "Kursga muvaffaqiyatli yozildingiz!");
    currentEnrollment = await findMyEnrollment();
    renderHeader(course);
  } catch (err) {
    showAlert('error', err instanceof ApiError ? err.message : "Yozilishda xatolik yuz berdi.");
  }
}

async function bumpProgress(course) {
  if (!currentEnrollment) return;
  const next = Math.min(100, currentEnrollment.progress_percent + 25);
  try {
    currentEnrollment = await api.patch(
      `/api/enrollments/${currentEnrollment.id}/progress/`,
      { progress_percent: next },
      { auth: true }
    );
    showAlert('success', next === 100 ? "Tabriklaymiz! Kurs tugatildi, sertifikat tayyorlanmoqda." : "Progress yangilandi.");
    renderHeader(course);
  } catch {
    showAlert('error', 'Progressni yangilab bo\'lmadi.');
  }
}

function renderSections(sections) {
  const container = document.getElementById('sectionsList');
  if (!sections || !sections.length) {
    container.innerHTML = '<p class="muted">Kurs dasturi hali qo\'shilmagan.</p>';
    return;
  }
  const canView = !!currentEnrollment || !!currentUser?.is_staff;

  container.innerHTML = sections.map((section) => `
    <div class="section-block">
      <div class="section-title">${escapeHtml(section.title)}</div>
      ${(section.lessons || []).map((lesson) => `
        <div class="lesson-item">
          ${canView ? '▶️' : '🔒'} ${escapeHtml(lesson.title)}
        </div>
      `).join('') || '<div class="lesson-item muted">Darslar hali qo\'shilmagan.</div>'}
    </div>
  `).join('');
}

function reviewItemHtml(review) {
  return `
    <div class="review-item">
      <strong>${escapeHtml(review.student_name)}</strong> — ${'⭐'.repeat(review.rating)}
      <p class="muted">${escapeHtml(review.comment || '')}</p>
    </div>
  `;
}

async function loadReviews() {
  const listEl = document.getElementById('reviewsList');
  try {
    const data = await api.get('/api/reviews/', { params: { course: courseId } });
    const reviews = data.results ?? data;
    listEl.innerHTML = reviews.length
      ? reviews.map(reviewItemHtml).join('')
      : '<p class="muted">Hali sharhlar yo\'q. Birinchi bo\'lib fikr bildiring!</p>';
  } catch {
    listEl.innerHTML = '<p class="muted">Sharhlarni yuklab bo\'lmadi.</p>';
  }
}

function renderReviewForm() {
  const el = document.getElementById('reviewForm');
  if (!isAuthenticated()) {
    el.innerHTML = '<p class="muted"><a href="login.html">Kirib</a> sharh qoldiring.</p>';
    return;
  }
  el.innerHTML = `
    <form id="reviewFormEl" class="panel" style="margin-bottom:16px;">
      <div class="form-row">
        <div class="form-group" style="max-width:140px;">
          <label>Baho</label>
          <select id="ratingInput">
            <option value="5">5 ⭐</option>
            <option value="4">4 ⭐</option>
            <option value="3">3 ⭐</option>
            <option value="2">2 ⭐</option>
            <option value="1">1 ⭐</option>
          </select>
        </div>
        <div class="form-group" style="flex:3;">
          <label>Fikringiz</label>
          <input type="text" id="commentInput" placeholder="Kurs haqida fikringiz..." />
        </div>
      </div>
      <button type="submit" class="btn btn-primary">Sharh qoldirish</button>
    </form>
  `;

  document.getElementById('reviewFormEl').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/reviews/', {
        course: Number(courseId),
        rating: Number(document.getElementById('ratingInput').value),
        comment: document.getElementById('commentInput').value.trim(),
      }, { auth: true });
      showAlert('success', 'Sharhingiz uchun rahmat!');
      document.getElementById('commentInput').value = '';
      loadReviews();
    } catch (err) {
      showAlert('error', err instanceof ApiError ? err.message : 'Sharh qoldirishda xatolik.');
    }
  });
}

async function init() {
  currentUser = await renderNavbar('');
  currentEnrollment = await findMyEnrollment();

  try {
    const course = await api.get(`/api/courses/${courseId}/`, { auth: isAuthenticated() });
    document.title = `${course.title} — EduNest`;
    renderHeader(course);
    renderSections(course.sections);
  } catch (err) {
    document.getElementById('courseHeader').innerHTML =
      '<div class="empty-state">Kurs topilmadi yoki yuklashda xatolik yuz berdi.</div>';
  }

  renderReviewForm();
  loadReviews();
}

init();
