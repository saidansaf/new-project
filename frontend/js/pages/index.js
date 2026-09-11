import { api } from '../api.js';
import { renderNavbar, escapeHtml } from '../navbar.js';
import { t } from '../i18n.js';

let currentPage = 1;
let currentParams = {};
let debounceTimer;

async function loadCategories() {
  try {
    const data = await api.get('/api/courses/categories/');
    const select = document.getElementById('categoryFilter');
    const categories = data.results || data;
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  } catch {
    // kategoriyalar hali bo'sh bo'lishi mumkin — jim o'tkazamiz
  }
}

function courseCardHtml(course) {
  const price = Number(course.price) === 0
    ? `<span class="price free">${t('free')}</span>`
    : `<span class="price">${course.price} so'm</span>`;
  const rating = course.average_rating ? `<span class="rating">⭐ ${course.average_rating}</span>` : '';
  const levelLabel = { beginner: t('level_beginner'), intermediate: t('level_intermediate'), advanced: t('level_advanced') }[course.level] || course.level;

  return `
    <a href="course.html?id=${course.id}" class="card">
      <div class="card-cover">📘</div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(course.title)}</h3>
        <div class="card-meta">
          <span class="badge level-${course.level}">${levelLabel}</span>
          ${course.category_name ? `<span>${escapeHtml(course.category_name)}</span>` : ''}
        </div>
        <div class="card-meta">
          <span>👨‍🏫 ${escapeHtml(course.instructor_name || '')}</span>
          ${rating}
        </div>
        <div class="card-footer">
          ${price}
          <span class="btn btn-outline btn-sm">${t('details')}</span>
        </div>
      </div>
    </a>
  `;
}

async function loadCourses(page = 1) {
  currentPage = page;
  const grid = document.getElementById('coursesGrid');
  grid.innerHTML = `<p class="muted">${t('loading')}</p>`;

  try {
    const data = await api.get('/api/courses/', { params: { ...currentParams, page } });
    const courses = data.results ?? data;

    if (!courses.length) {
      grid.innerHTML = `<div class="empty-state">${t('no_courses')}</div>`;
      renderPagination(null);
      return;
    }

    grid.innerHTML = courses.map(courseCardHtml).join('');
    renderPagination(data);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Kurslarni yuklashda xatolik: ${escapeHtml(err.message)}</div>`;
  }
}

function renderPagination(data) {
  const el = document.getElementById('pagination');
  el.innerHTML = '';
  if (!data || (!data.next && !data.previous)) return;

  if (data.previous) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline btn-sm';
    btn.textContent = t('prev');
    btn.onclick = () => loadCourses(currentPage - 1);
    el.appendChild(btn);
  }
  if (data.next) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline btn-sm';
    btn.textContent = t('next');
    btn.onclick = () => loadCourses(currentPage + 1);
    el.appendChild(btn);
  }
}

function bindFilters() {
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentParams.search = e.target.value;
      loadCourses(1);
    }, 350);
  });

  document.getElementById('categoryFilter').addEventListener('change', (e) => {
    currentParams.category = e.target.value;
    loadCourses(1);
  });

  document.getElementById('levelFilter').addEventListener('change', (e) => {
    currentParams.level = e.target.value;
    loadCourses(1);
  });
}

renderNavbar('courses');
loadCategories();
bindFilters();
loadCourses(1);
