import { api, ApiError } from '../api.js';
import { requireAuth } from '../auth.js';
import { renderNavbar } from '../navbar.js';

if (!requireAuth()) {
  throw new Error('not authenticated');
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200) || `kurs-${Date.now()}`;
}

async function loadCategories() {
  try {
    const data = await api.get('/api/courses/categories/');
    const select = document.getElementById('category');
    const categories = data.results || data;
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  } catch {
    // kategoriyalar bo'lmasligi mumkin
  }
}

function showAlert(type, message) {
  document.getElementById('alertBox').innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

async function init() {
  const user = await renderNavbar('create-course');
  if (!user) return;

  if (user.role !== 'instructor' && user.role !== 'admin') {
    showAlert('error', "Kurs yaratish faqat o'qituvchi yoki admin uchun mavjud.");
    document.getElementById('courseForm').style.display = 'none';
    return;
  }

  loadCategories();

  document.getElementById('courseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Yaratilmoqda...';

    const title = document.getElementById('title').value.trim();
    const payload = {
      title,
      slug: slugify(title),
      description: document.getElementById('description').value.trim(),
      price: document.getElementById('price').value,
      level: document.getElementById('level').value,
      category: document.getElementById('category').value || null,
    };

    try {
      const course = await api.post('/api/courses/', payload, { auth: true });
      showAlert('success', "Kurs yaratildi! Admin tasdiqlashini kuting.");
      setTimeout(() => { window.location.href = `course.html?id=${course.id}`; }, 1200);
    } catch (err) {
      showAlert('error', err instanceof ApiError ? JSON.stringify(err.data) : 'Xatolik yuz berdi.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kurs yaratish';
    }
  });
}

init();
