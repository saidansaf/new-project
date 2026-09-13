import { api, ApiError } from '../api.js';
import { isAuthenticated } from '../auth.js';
import { getLang, setLang, t } from '../i18n.js';
import { renderNavbar } from '../navbar.js';

const WORDS_UZ = [
  'kitob', 'maktab', 'dunyo', 'yulduz', 'osmon', 'quyosh', 'daryo', 'togʻ', 'baliq', 'qush',
  'gul', 'daraxt', 'bahor', 'yozgi', 'kuzgi', 'qishki', 'shahar', 'qishloq', 'yoʻl', 'koʻcha',
  'uy', 'oila', 'doʻst', 'ustoz', 'talaba', 'ilm', 'fan', 'texnika', 'dastur', 'kompyuter',
  'telefon', 'internet', 'sayohat', 'muzika', 'rasm', 'sport', 'sogʻliq', 'ovqat', 'suv', 'non',
  'olma', 'uzum', 'sabzi', 'kartoshka', 'mashina', 'poyezd', 'samolyot', 'dengiz', 'koʻl', 'chiroq',
  'stol', 'stul', 'deraza', 'eshik', 'devor', 'tom', 'bog', 'hovli', 'ish', 'vaqt',
  'kun', 'tun', 'hafta', 'oy', 'yil', 'asr', 'tarix', 'geografiya', 'matematika', 'fizika',
  'kimyo', 'biologiya', 'adabiyot', 'til', 'soʻz', 'gap', 'matn', 'sahifa', 'daftar', 'qalam',
];

const WORDS_EN = [
  'book', 'school', 'world', 'star', 'sky', 'sun', 'river', 'mountain', 'fish', 'bird',
  'flower', 'tree', 'spring', 'summer', 'autumn', 'winter', 'city', 'village', 'road', 'street',
  'house', 'family', 'friend', 'teacher', 'student', 'science', 'skill', 'technology', 'program', 'computer',
  'phone', 'internet', 'travel', 'music', 'picture', 'sport', 'health', 'food', 'water', 'bread',
  'apple', 'grape', 'carrot', 'potato', 'car', 'train', 'plane', 'sea', 'lake', 'light',
  'table', 'chair', 'window', 'door', 'wall', 'roof', 'garden', 'yard', 'work', 'time',
  'day', 'night', 'week', 'month', 'year', 'century', 'history', 'geography', 'math', 'physics',
  'chemistry', 'biology', 'literature', 'language', 'word', 'sentence', 'text', 'page', 'notebook', 'pencil',
];

const WORDS_RU = [
  'книга', 'школа', 'мир', 'звезда', 'небо', 'солнце', 'река', 'гора', 'рыба', 'птица',
  'цветок', 'дерево', 'весна', 'лето', 'осень', 'зима', 'город', 'село', 'дорога', 'улица',
  'дом', 'семья', 'друг', 'учитель', 'студент', 'наука', 'навык', 'техника', 'программа', 'компьютер',
  'телефон', 'интернет', 'путешествие', 'музыка', 'картина', 'спорт', 'здоровье', 'еда', 'вода', 'хлеб',
  'яблоко', 'виноград', 'морковь', 'картофель', 'машина', 'поезд', 'самолёт', 'море', 'озеро', 'свет',
  'стол', 'стул', 'окно', 'дверь', 'стена', 'крыша', 'сад', 'двор', 'работа', 'время',
  'день', 'ночь', 'неделя', 'месяц', 'год', 'век', 'история', 'география', 'математика', 'физика',
  'химия', 'биология', 'литература', 'язык', 'слово', 'предложение', 'текст', 'страница', 'тетрадь', 'карандаш',
];

const QUOTES = {
  uz: [
    "Bilim kuchdir, lekin uni toʻgʻri qoʻllay olish undan ham muhimroqdir.",
    "Har bir mutaxassis avval boshlovchi edi, faqat toʻxtamaganlar ustoz boʻladi.",
    "Kelajak bugun nima qilishimizga bogʻliq, shuning uchun har bir kun qadrlidir.",
  ],
  en: [
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Code is like humor. When you have to explain it, it is bad.",
  ],
  ru: [
    "Знание сила, но умение применять его важнее самого знания.",
    "Дорогу осилит идущий, а не тот, кто только мечтает о пути.",
    "Лучший способ предсказать будущее это создать его своими руками.",
  ],
};

const DURATIONS = [15, 30, 60, 120];
const WORD_COUNTS = [10, 25, 50, 100];

let mode = 'time';
let selectedDuration = 30;
let selectedWordCount = 25;
let punctuationEnabled = false;
let numbersEnabled = false;
let customText = '';

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
const zenFinishBtn = document.getElementById('zenFinishBtn');
const restartBtn = document.getElementById('restartBtn');

function currentWordBank() {
  const lang = getLang();
  if (lang === 'en') return WORDS_EN;
  if (lang === 'ru') return WORDS_RU;
  return WORDS_UZ;
}

function applyModifiers(words) {
  return words.map((w) => {
    let word = w;
    if (numbersEnabled && Math.random() < 0.15) {
      word = String(Math.floor(Math.random() * 1000));
    }
    if (punctuationEnabled && Math.random() < 0.12) {
      const marks = [',', '.', '!', '?'];
      word += marks[Math.floor(Math.random() * marks.length)];
    }
    return word;
  });
}

function randomWords(count) {
  const bank = currentWordBank();
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(bank[Math.floor(Math.random() * bank.length)]);
  }
  return applyModifiers(arr).join(' ');
}

function buildTargetText() {
  if (mode === 'time') return randomWords(250);
  if (mode === 'words') return randomWords(selectedWordCount);
  if (mode === 'quote') {
    const quotes = QUOTES[getLang()] || QUOTES.uz;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  if (mode === 'custom') return customText.trim();
  return ''; // zen — maqsad matn yo'q, erkin yozish
}

function renderBoard() {
  if (mode === 'zen') {
    board.classList.add('zen-board');
    board.textContent = hiddenInput.value || t('typing_start_hint');
    return;
  }
  board.classList.remove('zen-board');
  if (!targetText) {
    board.innerHTML = `<span class="char">${mode === 'custom' ? t('typing_custom_placeholder') : ''}</span>`;
    return;
  }
  board.innerHTML = [...targetText].map((ch) => `<span class="char">${ch === ' ' ? ' ' : ch}</span>`).join('');
  board.children[0]?.classList.add('current');
}

function resetTest() {
  clearInterval(timerInterval);
  finished = false;
  startTime = null;
  targetText = buildTargetText();
  hiddenInput.value = '';
  timeLeftEl.textContent = mode === 'time' ? selectedDuration : '0';
  liveWpmEl.textContent = '0';
  renderBoard();
  resultArea.hidden = true;
  typingArea.hidden = false;
}

function updateBoard() {
  if (mode === 'zen') {
    board.textContent = hiddenInput.value;
    return 0;
  }
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

function zenWordCount() {
  const typed = hiddenInput.value.trim();
  return typed ? typed.split(/\s+/).length : 0;
}

function startTimerIfNeeded() {
  if (startTime || finished) return;
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;

    if (mode === 'time') {
      const remaining = Math.max(0, Math.ceil(selectedDuration - elapsed));
      timeLeftEl.textContent = remaining;
      const correctChars = updateBoard();
      liveWpmEl.textContent = computeWpm(correctChars, elapsed);
      if (remaining <= 0) finishTest();
    } else if (mode === 'zen') {
      timeLeftEl.textContent = Math.floor(elapsed) + 's';
      liveWpmEl.textContent = computeWpm(zenWordCount() * 5, elapsed);
    } else {
      timeLeftEl.textContent = Math.floor(elapsed) + 's';
      const correctChars = updateBoard();
      liveWpmEl.textContent = computeWpm(correctChars, elapsed);
    }
  }, 200);
}

async function finishTest() {
  if (finished) return;
  finished = true;
  clearInterval(timerInterval);
  hiddenInput.blur();

  const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
  let wpm, accuracy, correct;

  if (mode === 'zen') {
    const wordCount = zenWordCount();
    wpm = elapsedSeconds > 0 ? Math.round(wordCount / (elapsedSeconds / 60)) : 0;
    accuracy = 100;
    correct = hiddenInput.value.length;
  } else {
    const typed = hiddenInput.value;
    correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === targetText[i]) correct++;
    }
    accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 0;
    const effectiveSeconds = mode === 'time' ? selectedDuration : elapsedSeconds;
    wpm = computeWpm(correct, effectiveSeconds);
  }

  typingArea.hidden = true;
  resultArea.hidden = false;
  resultArea.innerHTML = `
    <div class="typing-result">
      <div class="big">${wpm} WPM</div>
      <p>${t('typing_accuracy')}: <strong>${accuracy}%</strong> &nbsp;•&nbsp; ${t('typing_correct_chars')}: <strong>${correct}</strong></p>
      <button id="tryAgainBtn" class="btn btn-primary" style="margin-top:16px;">${t('typing_try_again')}</button>
      ${!isAuthenticated() ? `<p class="muted" style="margin-top:10px;"><a href="login.html">${t('login')}</a> — ${t('typing_login_to_save')}</p>` : ''}
    </div>
  `;
  document.getElementById('tryAgainBtn').addEventListener('click', resetTest);

  if (mode === 'time' && isAuthenticated() && wpm > 0) {
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
      : `<p class="muted">${t('typing_no_results')}</p>`;
  } catch {
    el.innerHTML = `<p class="muted">${t('typing_leaderboard_error')}</p>`;
  }
}

function renderOptionsRow() {
  const el = document.getElementById('optionsRow');
  let html = '';

  if (mode === 'time') {
    html = DURATIONS.map((d) => `<button class="chip ${d === selectedDuration ? 'active' : ''}" data-duration="${d}" type="button">${d}s</button>`).join('');
  } else if (mode === 'words') {
    html = WORD_COUNTS.map((c) => `<button class="chip ${c === selectedWordCount ? 'active' : ''}" data-count="${c}" type="button">${c}</button>`).join('');
  }
  html += '<button class="chip" id="shuffleBtn" type="button" title="Shuffle">🔀</button>';
  el.innerHTML = html;

  el.querySelectorAll('[data-duration]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedDuration = Number(btn.dataset.duration);
      renderOptionsRow();
      resetTest();
      loadLeaderboard();
    });
  });
  el.querySelectorAll('[data-count]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedWordCount = Number(btn.dataset.count);
      renderOptionsRow();
      resetTest();
    });
  });
  document.getElementById('shuffleBtn')?.addEventListener('click', resetTest);
}

function updateModeVisibility() {
  document.getElementById('customTextWrap').hidden = mode !== 'custom';
  zenFinishBtn.hidden = mode !== 'zen';
  restartBtn.hidden = mode === 'zen';
}

function bindModeTabs() {
  document.querySelectorAll('#modeTabs .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      document.querySelectorAll('#modeTabs .chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      updateModeVisibility();
      renderOptionsRow();
      resetTest();
    });
  });
}

function bindToggles() {
  document.getElementById('togglePunctuation').addEventListener('click', (e) => {
    punctuationEnabled = !punctuationEnabled;
    e.currentTarget.classList.toggle('active', punctuationEnabled);
    if (mode === 'time' || mode === 'words') resetTest();
  });
  document.getElementById('toggleNumbers').addEventListener('click', (e) => {
    numbersEnabled = !numbersEnabled;
    e.currentTarget.classList.toggle('active', numbersEnabled);
    if (mode === 'time' || mode === 'words') resetTest();
  });
}

function bindCustomText() {
  const textarea = document.getElementById('customTextArea');
  let debounceTimer;
  textarea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (startTime) return; // test ketayotgan bo'lsa matnni o'zgartirmaymiz
      customText = textarea.value;
      resetTest();
    }, 400);
  });
}

function bindLangBadge() {
  const badge = document.getElementById('langBadge');
  const order = ['uz', 'en', 'ru'];
  badge.textContent = `🌐 ${t('lang_name_' + getLang())}`;
  badge.addEventListener('click', () => {
    const next = order[(order.indexOf(getLang()) + 1) % order.length];
    setLang(next);
  });
}

function bindTyping() {
  board.addEventListener('click', () => hiddenInput.focus());
  restartBtn.addEventListener('click', resetTest);
  zenFinishBtn.addEventListener('click', finishTest);

  hiddenInput.addEventListener('input', () => {
    if (finished) return;
    startTimerIfNeeded();

    if (mode === 'zen') {
      updateBoard();
      const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
      liveWpmEl.textContent = computeWpm(zenWordCount() * 5, elapsed);
      return;
    }

    const correctChars = updateBoard();
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    liveWpmEl.textContent = computeWpm(correctChars, elapsed);

    if (targetText.length > 0 && hiddenInput.value.length >= targetText.length) finishTest();
  });
}

async function init() {
  await renderNavbar('typing');
  bindModeTabs();
  bindToggles();
  bindCustomText();
  bindLangBadge();
  bindTyping();
  updateModeVisibility();
  renderOptionsRow();
  resetTest();
  loadLeaderboard();
  hiddenInput.focus();
}

init();
