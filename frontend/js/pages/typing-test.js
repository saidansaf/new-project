import { api, ApiError } from '../api.js';
import { isAuthenticated } from '../auth.js';
import { renderNavbar } from '../navbar.js';

const WORDS = [
  'kitob', 'maktab', 'dunyo', 'yulduz', 'osmon', 'quyosh', 'daryo', 'togʻ', 'baliq', 'qush',
  'gul', 'daraxt', 'bahor', 'yozgi', 'kuzgi', 'qishki', 'shahar', 'qishloq', 'yoʻl', 'koʻcha',
  'uy', 'oila', 'do'st', 'ustoz', 'talaba', 'ilm', 'fan', 'texnika', 'dastur', 'kompyuter',
  'telefon', 'internet', 'sayohat', 'muzika', 'rasm', 'sport', 'sogʻliq', 'ovqat', 'suv', 'non',
  'olma', 'uzum', 'sabzi', 'kartoshka', 'mashina', 'poyezd', 'samolyot', 'dengiz', 'koʻl', 'chiroq',
  'stol', 'stul', 'deraza', 'eshik', 'devor', 'tom', 'bog', 'hovli', 'ish', 'vaqt',
  'kun', 'tun', 'hafta', 'oy', 'yil', 'asr', 'tarix', 'geografiya', 'matematika', 'fizika',
  'kimyo', 'biologiya', 'adabiyot', 'til', 'soʻz', 'gap', 'matn', 'sahifa', 'daftar', 'qalam',
];

const DURATIONS = [15, 30, 60, 120];
let selectedDuration = 30;
let targetText = '';
let startTime = null;
let timerInterval = null;
let finished = false;

const board = document.getElementById('typingBoard');
const hiddenInput = document.getElementById('typingHiddenInput');
const timeLeftEl = document.getElementById('timeLeft');
const liveWpmEl = document.getElementById('liveWpm');
const resultArea = document.getElementById('resultArea');
const typingArea = document.getElementById('typingArea');

function randomWords(count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return arr.join(' ');
}

function renderBoard() {
  board.innerHTML = [...targetText].map((ch) => `<span class="char">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  board.children[0]?.classList.add('current');
}

function resetTest() {
  clearInterval(timerInterval);
  finished = false;
  startTime = null;
  targetText = randomWords(250);
  hiddenInput.value = '';
  timeLeftEl.textContent = selectedDuration;
  liveWpmEl.textContent = '0';
  renderBoard();
  resultArea.hidden = true;
  typingArea.hidden = false;
}

function updateBoard() {
  const typed = hiddenInput.value;
  const chars = board.children;
  let correctCount = 0;

  for (let i = 0; i < chars.length; i++) {
    chars[i].classList.remove('correct', 'incorrect', 'current');
    if (i < typed.length) {
      const isCorrect = typed[i] === targetText[i];
      chars[i].classList.add(isCorrect ? 'correct' : 'incorrect');
      if (isCorrect) correctCount++;
    }
  }
  if (typed.length < chars.length) chars[typed.length].classList.add('current');

  return correctCount;
}

function computeWpm(correctChars, elapsedSeconds) {
  if (elapsedSeconds <= 0) return 0;
  return Math.round((correctChars / 5) / (elapsedSeconds / 60));
}

function startTimerIfNeeded() {
  if (startTime || finished) return;
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, Math.ceil(selectedDuration - elapsed));
    timeLeftEl.textContent = remaining;

    const correctChars = updateBoard();
    liveWpmEl.textContent = computeWpm(correctChars, elapsed);

    if (remaining <= 0) finishTest();
  }, 200);
}

async function finishTest() {
  if (finished) return;
  finished = true;
  clearInterval(timerInterval);
  hiddenInput.blur();

  const typed = hiddenInput.value;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === targetText[i]) correct++;
  }
  const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 0;
  const wpm = computeWpm(correct, selectedDuration);

  typingArea.hidden = true;
  resultArea.hidden = false;
  resultArea.innerHTML = `
    <div class="typing-result">
      <div class="big">${wpm} WPM</div>
      <p>Aniqlik: <strong>${accuracy}%</strong> &nbsp;•&nbsp; To'g'ri belgilar: <strong>${correct}</strong></p>
      <button id="tryAgainBtn" class="btn btn-primary" style="margin-top:16px;">🔄 Qayta urinish</button>
      ${!isAuthenticated() ? '<p class="muted" style="margin-top:10px;"><a href="login.html">Kirsangiz</a> natijangiz reytingga saqlanadi.</p>' : ''}
    </div>
  `;
  document.getElementById('tryAgainBtn').addEventListener('click', resetTest);

  if (isAuthenticated() && wpm > 0) {
    try {
      await api.post('/api/typing/submit/', { duration_seconds: selectedDuration, wpm, accuracy }, { auth: true });
      loadLeaderboard();
    } catch {
      // saqlashda xato bo'lsa ham natija ekranda ko'rinaveradi
    }
  }
}

async function loadLeaderboard() {
  const el = document.getElementById('leaderboard');
  document.getElementById('lbDurationLabel').textContent = selectedDuration;
  try {
    const data = await api.get('/api/typing/leaderboard/', { params: { duration: selectedDuration } });
    const items = data.results ?? data;
    el.innerHTML = items.length
      ? items.map((r, i) => `
          <div class="leaderboard-item">
            <span><span class="rank-badge">#${i + 1}</span> ${r.username}</span>
            <strong>${r.wpm} WPM</strong>
          </div>
        `).join('')
      : '<p class="muted">Hali natijalar yo\'q. Birinchi bo\'ling!</p>';
  } catch {
    el.innerHTML = '<p class="muted">Reytingni yuklab bo\'lmadi.</p>';
  }
}

function bindDurationOptions() {
  document.querySelectorAll('.typing-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedDuration = Number(btn.dataset.duration);
      document.querySelectorAll('.typing-option').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      resetTest();
      loadLeaderboard();
    });
  });
}

function bindTyping() {
  board.addEventListener('click', () => hiddenInput.focus());
  document.getElementById('restartBtn').addEventListener('click', resetTest);

  hiddenInput.addEventListener('input', () => {
    if (finished) return;
    startTimerIfNeeded();
    const correctChars = updateBoard();
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    liveWpmEl.textContent = computeWpm(correctChars, elapsed);

    if (hiddenInput.value.length >= targetText.length) finishTest();
  });
}

function bindTheme() {
  const btn = document.getElementById('themeToggle');
  const isDark = localStorage.getItem('edunest_typing_theme') === 'dark';
  if (isDark) document.body.classList.add('typing-dark');
  btn.textContent = isDark ? '☀️ Oq rejim' : '🌙 Qora rejim';

  btn.addEventListener('click', () => {
    const nowDark = document.body.classList.toggle('typing-dark');
    localStorage.setItem('edunest_typing_theme', nowDark ? 'dark' : 'light');
    btn.textContent = nowDark ? '☀️ Oq rejim' : '🌙 Qora rejim';
  });
}

async function init() {
  await renderNavbar('typing');
  bindDurationOptions();
  bindTyping();
  bindTheme();
  resetTest();
  loadLeaderboard();
  hiddenInput.focus();
}

init();
