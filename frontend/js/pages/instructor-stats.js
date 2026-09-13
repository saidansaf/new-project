import { api } from '../api.js';
import { requireAuth } from '../auth.js';
import { t } from '../i18n.js';
import { escapeHtml, renderNavbar } from '../navbar.js';

if (!requireAuth()) {
  throw new Error('not authenticated');
}

function renderSummary(courses) {
  const totalEnrollments = courses.reduce((sum, c) => sum + c.enrollments_count, 0);
  const totalRevenue = courses.reduce((sum, c) => sum + Number(c.total_revenue), 0);
  const ratedCourses = courses.filter((c) => c.average_rating !== null);
  const avgRating = ratedCourses.length
    ? (ratedCourses.reduce((sum, c) => sum + c.average_rating, 0) / ratedCourses.length).toFixed(1)
    : '—';

  document.getElementById('summaryCards').innerHTML = `
    <div class="stat-card"><div class="value">${courses.length}</div><div class="label">${t('stat_total_courses')}</div></div>
    <div class="stat-card"><div class="value">${totalEnrollments}</div><div class="label">${t('stat_total_enrollments')}</div></div>
    <div class="stat-card"><div class="value">${avgRating}</div><div class="label">${t('stat_avg_rating')}</div></div>
    <div class="stat-card"><div class="value">${totalRevenue.toLocaleString('uz-UZ')}</div><div class="label">${t('stat_total_revenue')}</div></div>
  `;
}

function renderTable(courses) {
  const el = document.getElementById('coursesTable');
  if (!courses.length) {
    el.innerHTML = `<div class="empty-state">${t('no_courses_yet')} <a href="create-course.html">${t('create_course')}</a></div>`;
    return;
  }
  el.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>${t('course_name')}</th>
          <th>${t('price_label')}</th>
          <th>${t('stat_total_enrollments')}</th>
          <th>${t('stat_avg_rating')}</th>
          <th>${t('stat_total_revenue')}</th>
          <th>${t('status')}</th>
        </tr>
      </thead>
      <tbody>
        ${courses.map((c) => `
          <tr>
            <td><a href="course.html?id=${c.id}">${escapeHtml(c.title)}</a></td>
            <td>${c.price === '0.00' ? t('free') : c.price + " so'm"}</td>
            <td>${c.enrollments_count}</td>
            <td>${c.average_rating ?? '—'}${c.average_rating ? ' ⭐' : ''} (${c.reviews_count})</td>
            <td>${Number(c.total_revenue).toLocaleString('uz-UZ')} so'm</td>
            <td>${c.is_approved ? `<span class="badge level-beginner">✅ ${t('approved')}</span>` : `<span class="badge level-intermediate">⏳ ${t('pending_approval')}</span>`}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function init() {
  await renderNavbar('instructor-stats');
  try {
    const courses = await api.get('/api/courses/my-stats/', { auth: true });
    renderSummary(courses);
    renderTable(courses);
  } catch {
    document.getElementById('coursesTable').innerHTML = `<p class="muted">${t('stats_load_error')}</p>`;
  }
}

init();
