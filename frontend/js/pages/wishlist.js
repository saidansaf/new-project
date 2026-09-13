import { api, ApiError } from '../api.js';
import { requireAuth } from '../auth.js';
import { t } from '../i18n.js';
import { escapeHtml, renderNavbar } from '../navbar.js';

if (!requireAuth()) {
  throw new Error('not authenticated');
}

function cardHtml(item) {
  const price = Number(item.course_price) === 0
    ? `<span class="price free">${t('free')}</span>`
    : `<span class="price">${item.course_price} so'm</span>`;
  const rating = item.average_rating ? `<span class="rating">⭐ ${item.average_rating}</span>` : '';

  return `
    <div class="card" style="position:relative;">
      <button class="btn btn-ghost btn-sm remove-wishlist-btn" data-course-id="${item.course}" title="O'chirish" style="position:absolute;top:8px;right:8px;z-index:2;background:var(--color-surface);border-radius:50%;">✕</button>
      <a href="course.html?id=${item.course}" style="color:inherit;">
        <div class="card-cover">📘</div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(item.course_title)}</h3>
          <div class="card-meta">${rating}</div>
          <div class="card-footer">${price}<span class="btn btn-outline btn-sm">${t('details')}</span></div>
        </div>
      </a>
    </div>
  `;
}

async function removeItem(courseId) {
  try {
    await api.delete(`/api/enrollments/wishlist/${courseId}/`, { auth: true });
    loadWishlist();
  } catch {
    // jim o'tkazamiz
  }
}

async function loadWishlist() {
  const el = document.getElementById('wishlistGrid');
  try {
    const data = await api.get('/api/enrollments/wishlist/', { auth: true });
    const items = data.results ?? data;
    el.innerHTML = items.length
      ? items.map(cardHtml).join('')
      : `<div class="empty-state">${t('wishlist_empty')} <a href="index.html">${t('courses')}</a></div>`;

    el.querySelectorAll('.remove-wishlist-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        removeItem(Number(btn.dataset.courseId));
      });
    });
  } catch (err) {
    el.innerHTML = `<p class="muted">${err instanceof ApiError ? err.message : t('wishlist_load_error')}</p>`;
  }
}

async function init() {
  await renderNavbar('wishlist');
  loadWishlist();
}

init();
