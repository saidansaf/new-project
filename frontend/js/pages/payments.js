import { api } from '../api.js';
import { requireAuth } from '../auth.js';
import { t } from '../i18n.js';
import { escapeHtml, renderNavbar } from '../navbar.js';

if (!requireAuth()) {
  throw new Error('not authenticated');
}

const STATUS_LABEL = {
  pending: { text: t('payment_status_pending'), cls: 'level-intermediate' },
  paid: { text: t('payment_status_paid'), cls: 'level-beginner' },
  failed: { text: t('payment_status_failed'), cls: 'level-advanced' },
};

const METHOD_LABEL = { click: 'Click', payme: 'Payme' };

function paymentRowHtml(p) {
  const status = STATUS_LABEL[p.status] || { text: p.status, cls: '' };
  const date = new Date(p.created_at).toLocaleString('uz-UZ');
  return `
    <div class="list-item">
      <div>
        <div><strong>${escapeHtml(p.course_title || ('Kurs #' + p.course))}</strong></div>
        <div class="muted" style="font-size:12px;">${date} · ${METHOD_LABEL[p.payment_method] || p.payment_method} · ${escapeHtml(p.transaction_id)}</div>
      </div>
      <div style="text-align:right;">
        <div><strong>${p.amount} so'm</strong></div>
        <span class="badge ${status.cls}">${status.text}</span>
      </div>
    </div>
  `;
}

async function loadPayments() {
  const el = document.getElementById('paymentsList');
  try {
    const data = await api.get('/api/payments/history/', { auth: true });
    const items = data.results ?? data;
    el.innerHTML = items.length
      ? items.map(paymentRowHtml).join('')
      : `<div class="empty-state">${t('no_payments')}</div>`;
  } catch {
    el.innerHTML = `<p class="muted">${t('payments_load_error')}</p>`;
  }
}

async function init() {
  await renderNavbar('payments');
  loadPayments();
}

init();
