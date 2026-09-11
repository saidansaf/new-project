import { api, ApiError } from './api.js';
import { escapeHtml } from './navbar.js';
import { getAccessToken, isAuthenticated } from './auth.js';

const MAX_HISTORY = 20;

function getCurrentUserId() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.user_id ?? null;
  } catch {
    return null;
  }
}

// Har bir foydalanuvchi (yoki mehmon) uchun alohida kalit — logout/login qilganda
// boshqa odamning eski xabarlari ko'rinib qolmasligi uchun.
function historyKey() {
  const userId = getCurrentUserId();
  return userId ? `edunest_ai_chat_history_u${userId}` : 'edunest_ai_chat_history_guest';
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(historyKey())) || [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(historyKey(), JSON.stringify(history.slice(-MAX_HISTORY)));
  } catch {
    // localStorage yo'q/to'la bo'lsa ham chat ishlayveradi, faqat tarix saqlanmaydi
  }
}

function buildWidget() {
  const root = document.createElement('div');
  root.id = 'aiChatRoot';
  root.innerHTML = `
    <button id="aiChatToggle" class="ai-chat-fab" type="button" title="AI yordamchi">✨</button>
    <div id="aiChatWindow" class="ai-chat-window" hidden>
      <div class="ai-chat-header">
        <span>✨ EduNest AI yordamchi</span>
        <button id="aiChatClose" class="ai-chat-close" type="button" aria-label="Yopish">✕</button>
      </div>
      <div id="aiChatMessages" class="ai-chat-messages"></div>
      <form id="aiChatForm" class="ai-chat-input-row">
        <input id="aiChatInput" type="text" placeholder="Savolingizni yozing..." autocomplete="off" />
        <button type="submit" class="btn btn-primary btn-sm">➤</button>
      </form>
    </div>
  `;
  document.body.appendChild(root);
  return root;
}

function messageHtml(role, content) {
  const cls = role === 'user' ? 'ai-msg-user' : 'ai-msg-bot';
  return `<div class="ai-msg ${cls}">${escapeHtml(content)}</div>`;
}

function init() {
  if (document.getElementById('aiChatRoot')) return; // sahifada ikki marta yuklanmasin
  buildWidget();

  const toggleBtn = document.getElementById('aiChatToggle');
  const closeBtn = document.getElementById('aiChatClose');
  const windowEl = document.getElementById('aiChatWindow');
  const messagesEl = document.getElementById('aiChatMessages');
  const form = document.getElementById('aiChatForm');
  const input = document.getElementById('aiChatInput');

  let history = loadHistory();
  if (history.length) {
    messagesEl.innerHTML = history.map((m) => messageHtml(m.role, m.content)).join('');
  } else {
    messagesEl.innerHTML = messageHtml('assistant', "Salom! Men EduNest AI yordamchisiman. Kurslar yoki platforma haqida savolingiz bo'lsa, yozing 👋");
  }

  toggleBtn.addEventListener('click', () => {
    windowEl.hidden = !windowEl.hidden;
    if (!windowEl.hidden) {
      input.focus();
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  });
  closeBtn.addEventListener('click', () => { windowEl.hidden = true; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    messagesEl.insertAdjacentHTML('beforeend', messageHtml('user', text));
    input.value = '';
    messagesEl.scrollTop = messagesEl.scrollHeight;

    if (!isAuthenticated()) {
      messagesEl.insertAdjacentHTML('beforeend', messageHtml(
        'assistant',
        "AI yordamchidan foydalanish uchun avval tizimga kiring yoki ro'yxatdan o'ting. 🔐"
      ));
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return;
    }

    history.push({ role: 'user', content: text });
    input.disabled = true;

    const typingId = 'ai-typing-' + Date.now();
    messagesEl.insertAdjacentHTML('beforeend', `<div class="ai-msg ai-msg-bot" id="${typingId}">...</div>`);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const data = await api.post('/api/recommendations/chat/', { message: text, history });
      document.getElementById(typingId)?.remove();
      messagesEl.insertAdjacentHTML('beforeend', messageHtml('assistant', data.reply));
      history.push({ role: 'assistant', content: data.reply });
      saveHistory(history);
    } catch (err) {
      document.getElementById(typingId)?.remove();
      const errMsg = err instanceof ApiError ? err.message : "AI bilan bog'lanishda xatolik yuz berdi.";
      messagesEl.insertAdjacentHTML('beforeend', messageHtml('assistant', `⚠️ ${errMsg}`));
    } finally {
      input.disabled = false;
      input.focus();
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  });
}

init();
