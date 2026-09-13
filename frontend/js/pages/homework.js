import { api } from '../api.js';
import { requireAuth } from '../auth.js';
import { t } from '../i18n.js';
import { escapeHtml, renderNavbar } from '../navbar.js';

if (!requireAuth()) {
  throw new Error('not authenticated');
}

function statusBadgeHtml(submission, maxScore) {
  if (!submission) {
    return `<span class="badge level-advanced">${t('homework_status_pending')}</span>`;
  }
  if (submission.grade !== null && submission.grade !== undefined) {
    return `<span class="badge level-beginner">${t('homework_status_graded')}: ${submission.grade}/${maxScore}</span>`;
  }
  return `<span class="badge level-intermediate">${t('homework_status_submitted')}</span>`;
}

function cardHtml(item) {
  return `
    <div class="list-item" style="flex-direction:column;align-items:stretch;gap:6px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <div class="muted" style="font-size:12px;">${escapeHtml(item.courseTitle)} · ${escapeHtml(item.sectionTitle)}</div>
          <strong>${escapeHtml(item.assignment.title)}</strong>
        </div>
        ${statusBadgeHtml(item.submission, item.assignment.max_score)}
      </div>
      ${item.assignment.description ? `<p class="muted" style="margin:0;">${escapeHtml(item.assignment.description)}</p>` : ''}
      ${item.submission && item.submission.feedback ? `<p style="margin:0;"><strong>Fikr:</strong> ${escapeHtml(item.submission.feedback)}</p>` : ''}
      <a href="course.html?id=${item.courseId}" class="btn btn-outline btn-sm" style="align-self:flex-start;">${t('homework_go_to_course')}</a>
    </div>
  `;
}

async function loadHomework() {
  const el = document.getElementById('homeworkList');

  try {
    const enrollments = await api.get('/api/enrollments/my/', { auth: true });
    const courses = await Promise.all(
      (enrollments || []).map((e) => api.get(`/api/courses/${e.course}/`, { auth: true }).catch(() => null))
    );

    const assignmentRefs = [];
    courses.forEach((course) => {
      if (!course) return;
      (course.sections || []).forEach((section) => {
        if (section.assignment_id) {
          assignmentRefs.push({
            courseId: course.id,
            courseTitle: course.title,
            sectionTitle: section.title,
            assignmentId: section.assignment_id,
          });
        }
      });
    });

    if (!assignmentRefs.length) {
      el.innerHTML = `<div class="empty-state">${t('homework_empty')}</div>`;
      return;
    }

    const [assignments, subsData] = await Promise.all([
      Promise.all(assignmentRefs.map((ref) => api.get(`/api/assignments/${ref.assignmentId}/`, { auth: true }))),
      api.get('/api/assignments/my-submissions/', { auth: true }),
    ]);
    const subs = subsData.results ?? subsData;
    const subsByAssignment = new Map((subs || []).map((s) => [s.assignment, s]));

    const items = assignmentRefs.map((ref, i) => ({
      ...ref,
      assignment: assignments[i],
      submission: subsByAssignment.get(ref.assignmentId) || null,
    }));

    el.innerHTML = items.map(cardHtml).join('');
  } catch {
    el.innerHTML = `<p class="muted">${t('homework_load_error')}</p>`;
  }
}

async function init() {
  await renderNavbar('homework');
  loadHomework();
}

init();
