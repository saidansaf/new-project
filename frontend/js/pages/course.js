import { api, ApiError } from '../api.js';
import { isAuthenticated } from '../auth.js';
import { renderNavbar, escapeHtml } from '../navbar.js';
import { createPlayer, extractYouTubeId } from '../youtube.js';

const courseId = new URLSearchParams(window.location.search).get('id');
const alertBox = document.getElementById('alertBox');
const playerPanel = document.getElementById('playerPanel');

if (!courseId) {
  alertBox.innerHTML = '<div class="alert alert-error">Kurs ID ko\'rsatilmagan.</div>';
  throw new Error('missing course id');
}

let currentUser = null;
let currentEnrollment = null;
let currentCourse = null;
let watchedLessonIds = new Set();
let activeLessonId = null;
let ytPlayer = null;

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

async function loadWatchedLessons() {
  if (!isAuthenticated()) return;
  try {
    const ids = await api.get('/api/enrollments/watched-lessons/', {
      auth: true,
      params: { course: courseId },
    });
    watchedLessonIds = new Set(ids);
  } catch {
    watchedLessonIds = new Set();
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
      <div class="muted" style="margin-top:4px;">Progress: ${pct}% (video 50% + testlar 50%)</div>
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
}

async function enroll(course) {
  try {
    await api.post('/api/enrollments/', { course: course.id }, { auth: true });
    showAlert('success', "Kursga muvaffaqiyatli yozildingiz!");
    currentEnrollment = await findMyEnrollment();
    await loadWatchedLessons();
    renderHeader(course);
    renderSections(course.sections);
  } catch (err) {
    showAlert('error', err instanceof ApiError ? err.message : "Yozilishda xatolik yuz berdi.");
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
      ${(section.lessons || []).map((lesson) => {
        const watched = watchedLessonIds.has(lesson.id);
        const icon = !canView ? '🔒' : watched ? '✅' : '▶️';
        const classes = ['lesson-item', canView ? 'clickable' : '', watched ? 'watched' : '', lesson.id === activeLessonId ? 'active' : ''].join(' ');
        return `<div class="${classes}" data-lesson-id="${lesson.id}">${icon} ${escapeHtml(lesson.title)}</div>`;
      }).join('') || '<div class="lesson-item muted">Darslar hali qo\'shilmagan.</div>'}
      ${section.quiz_id ? `
        <div class="quiz-row">
          <span>📝 Bo'lim testi</span>
          <button class="btn btn-outline btn-sm quiz-open-btn" data-quiz-id="${section.quiz_id}" ${canView ? '' : 'disabled'}>Testni boshlash</button>
        </div>
      ` : ''}
    </div>
  `).join('');

  if (canView) {
    container.querySelectorAll('.lesson-item.clickable').forEach((el) => {
      el.addEventListener('click', () => openLesson(Number(el.dataset.lessonId)));
    });
  }
  container.querySelectorAll('.quiz-open-btn').forEach((btn) => {
    btn.addEventListener('click', () => openQuiz(Number(btn.dataset.quizId)));
  });
}

function findLesson(lessonId) {
  for (const section of currentCourse.sections || []) {
    const lesson = (section.lessons || []).find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}

async function openLesson(lessonId) {
  const lesson = findLesson(lessonId);
  if (!lesson) return;
  activeLessonId = lessonId;
  renderSections(currentCourse.sections);

  const videoId = extractYouTubeId(lesson.video_url);

  playerPanel.hidden = false;
  playerPanel.innerHTML = `
    <div class="player-panel">
      <h3>${escapeHtml(lesson.title)}</h3>
      ${videoId
        ? `<div class="video-wrapper"><div id="ytPlayerEl"></div></div>`
        : '<p class="muted">Bu darsga video hali biriktirilmagan.</p>'}
      ${lesson.content ? `<p style="margin-top:12px;">${escapeHtml(lesson.content)}</p>` : ''}
      ${watchedLessonIds.has(lesson.id) ? '<p class="badge" style="margin-top:8px;">✅ Ko\'rilgan</p>' : '<p class="muted" style="margin-top:8px;">Video oxirigacha ko\'rilganda avtomatik belgilanadi.</p>'}
    </div>
  `;
  playerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (videoId) {
    ytPlayer = await createPlayer('ytPlayerEl', videoId, () => onLessonWatched(lessonId));
  }
}

async function onLessonWatched(lessonId) {
  if (watchedLessonIds.has(lessonId)) return;
  try {
    const data = await api.post('/api/enrollments/watch-lesson/', { lesson: lessonId }, { auth: true });
    watchedLessonIds.add(lessonId);
    showAlert('success', "Video ko'rildi deb belgilandi, progress yangilandi!");
    if (currentEnrollment) currentEnrollment.progress_percent = data.progress_percent;
    renderHeader(currentCourse);
    renderSections(currentCourse.sections);
  } catch {
    showAlert('error', "Progressni yangilab bo'lmadi.");
  }
}

async function openQuiz(quizId) {
  playerPanel.hidden = false;
  playerPanel.innerHTML = '<div class="player-panel"><p class="muted">Test yuklanmoqda...</p></div>';
  playerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const quiz = await api.get(`/api/quizzes/${quizId}/`, { auth: true });
    renderQuiz(quiz);
  } catch {
    playerPanel.innerHTML = '<div class="player-panel"><p class="muted">Testni yuklab bo\'lmadi.</p></div>';
  }
}

function renderQuiz(quiz) {
  playerPanel.innerHTML = `
    <div class="player-panel">
      <h3>📝 ${escapeHtml(quiz.title)}</h3>
      <form id="quizForm">
        ${quiz.questions.map((q) => `
          <div class="quiz-question">
            <p>${escapeHtml(q.text)}</p>
            ${q.answers.map((a) => `
              <label class="quiz-option">
                <input type="${q.question_type === 'multiple' ? 'checkbox' : 'radio'}" name="q_${q.id}" value="${a.id}" />
                ${escapeHtml(a.text)}
              </label>
            `).join('')}
          </div>
        `).join('')}
        <button type="submit" class="btn btn-primary" style="margin-top:12px;">Javoblarni yuborish</button>
      </form>
    </div>
  `;

  document.getElementById('quizForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const answers = {};
    quiz.questions.forEach((q) => {
      const checked = [...document.querySelectorAll(`input[name="q_${q.id}"]:checked`)].map((el) => Number(el.value));
      answers[q.id] = checked;
    });

    try {
      const result = await api.post(`/api/quizzes/${quiz.id}/submit/`, { answers }, { auth: true });
      renderQuizResult(result);
      if (currentEnrollment && result.progress_percent !== null && result.progress_percent !== undefined) {
        currentEnrollment.progress_percent = result.progress_percent;
        renderHeader(currentCourse);
      }
    } catch (err) {
      showAlert('error', err instanceof ApiError ? err.message : 'Testni yuborishda xatolik.');
    }
  });
}

function renderQuizResult(result) {
  playerPanel.innerHTML = `
    <div class="player-panel quiz-result-box">
      <div class="score">${result.score}%</div>
      <p>${result.correct} / ${result.total} to'g'ri javob</p>
      <p class="badge" style="background:${result.passed ? '#ecfdf5' : '#fef2f2'};color:${result.passed ? 'var(--color-success)' : 'var(--color-danger)'};">
        ${result.passed ? "✅ O'tdingiz!" : "❌ O'ta olmadingiz (kamida 60% kerak)"}
      </p>
    </div>
  `;
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
  await loadWatchedLessons();

  try {
    const course = await api.get(`/api/courses/${courseId}/`, { auth: isAuthenticated() });
    currentCourse = course;
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
