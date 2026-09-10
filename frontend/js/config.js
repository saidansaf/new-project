// Frontend endi backend bilan BITTA domendan beriladi (Django + WhiteNoise), shuning
// uchun standart holatda bo'sh qatorni (o'sha domenning o'zi) ishlatamiz.
// Faqat alohida statik server orqali (masalan `python -m http.server 5500`) ochilganda
// backend boshqa portda (8000) bo'lgani uchun to'liq manzil kerak bo'ladi.
const isStandaloneStaticServer = window.location.port === '5500';

export const API_BASE_URL =
  window.EDUNEST_API_BASE_URL || (isStandaloneStaticServer ? 'http://localhost:8000' : '');
