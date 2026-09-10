// Lokalda ishlaganda (localhost/127.0.0.1) — lokal backend, aks holda — Render'dagi live backend.
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE_URL =
  window.EDUNEST_API_BASE_URL || (isLocal ? 'http://localhost:8000' : 'https://edunest-backend-65xk.onrender.com');
