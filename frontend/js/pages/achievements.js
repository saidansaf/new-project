import { api } from '../api.js';
import { requireAuth } from '../auth.js';
import { t } from '../i18n.js';
import { escapeHtml, renderNavbar } from '../navbar.js';

if (!requireAuth()) {
  throw new Error('not authenticated');
}

function earnedCardHtml(userBadge) {
  const b = userBadge.badge;
  return `
    <div class="badge-card">
      <div class="icon">${b.icon}</div>
      <div class="title">${escapeHtml(b.title)}</div>
      <div class="desc">${escapeHtml(b.description)}</div>
      <div class="desc" style="margin-top:6px;">${new Date(userBadge.earned_at).toLocaleDateString('uz-UZ')}</div>
    </div>
  `;
}

function lockedCardHtml(badge) {
  return `
    <div class="badge-card locked">
      <div class="icon">${badge.icon}</div>
      <div class="title">${escapeHtml(badge.title)}</div>
      <div class="desc">${escapeHtml(badge.description)}</div>
    </div>
  `;
}

async function init() {
  await renderNavbar('achievements');
  try {
    const data = await api.get('/api/achievements/my/', { auth: true });
    document.getElementById('earnedGrid').innerHTML = data.earned.length
      ? data.earned.map(earnedCardHtml).join('')
      : `<p class="muted">${t('achievements_none_yet') || "Hali yutuqlaringiz yo'q."}</p>`;
    document.getElementById('lockedGrid').innerHTML = data.locked.map(lockedCardHtml).join('');
  } catch {
    document.getElementById('earnedGrid').innerHTML = `<p class="muted">Yutuqlarni yuklab bo'lmadi.</p>`;
  }
}

init();
