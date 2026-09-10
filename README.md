# EduNest — Online Ta'lim Platformasi

Django + DRF backend, Telegram bot (aiogram) va Docker/Render.com orqali deploy qilinadigan
AI-powered LMS (Learning Management System) loyihasi.

To'liq texnik topshiriq: [`../EduNest_TZ.md`](../EduNest_TZ.md)

## Loyiha tuzilishi

```
EduNest/
├── backend/            # Django + DRF (API, admin, Celery, Channels)
│   ├── apps/            # users, courses, enrollments, quizzes, payments,
│   │                     reviews, notifications, ai_recommend, certificates, telegram_bot
│   ├── config/           # settings, urls, celery, asgi/wsgi
│   ├── requirements.txt
│   └── Dockerfile
├── bot/                 # Telegram bot (aiogram 3.x)
│   ├── handlers/
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml   # Lokal: db, redis, backend, celery_worker, celery_beat, bot (alohida xizmatlar)
├── Dockerfile           # Render deploy uchun: backend+bot BITTA konteynerda (bepul tarif uchun)
├── entrypoint.sh         # Dockerfile'ning ishga tushirish skripti (migrate + bot + daphne)
├── render.yaml          # Render.com blueprint (bitta web xizmat + Redis)
└── README.md
```

## 1. Lokal ishga tushirish (Docker'siz, tez tekshirish uchun)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env           # kerak bo'lsa qiymatlarni o'zgartiring
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

- API: http://127.0.0.1:8000/api/
- Swagger hujjatlari: http://127.0.0.1:8000/api/docs/
- Admin panel: http://127.0.0.1:8000/admin/

> Standart holatda `DATABASE_URL` bo'sh bo'lsa SQLite ishlatiladi, `CELERY_TASK_ALWAYS_EAGER=True`
> bo'lgani uchun Celery/Redis ishga tushirilmasa ham fon vazifalar sinxron bajariladi — lokal
> tekshirish uchun Redis/Postgres shart emas.

Botni sinash uchun (haqiqiy Telegram token kerak — [@BotFather](https://t.me/BotFather)):

```bash
cd bot
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env           # BOT_TOKEN ni kiriting, API_BASE_URL=http://localhost:8000
python main.py
```

## 2. Docker Compose bilan to'liq stack (backend + bot + Postgres + Redis + Celery)

```bash
cp backend/.env.example backend/.env
cp bot/.env.example bot/.env
# backend/.env va bot/.env ichida SECRET_KEY, BOT_TOKEN, BOT_API_SECRET ni to'ldiring
# (ikkala faylda BOT_API_SECRET bir xil bo'lishi shart!)

docker compose up --build
```

Xizmatlar: `backend` (8000-port), `bot`, `celery_worker`, `celery_beat`, `db` (Postgres), `redis`.

## 3. Render.com'ga deploy (bepul tarif, bitta xizmat)

Render'ning bepul tarifida **Background Worker** mavjud emas va bitta akkauntda faqat **bitta
bepul PostgreSQL** bo'ladi. Shu sababli production uchun repo ildizidagi `Dockerfile` backend
va Telegram botni **bitta konteynerda** birga ishga tushiradi (bot fon jarayon sifatida,
Django esa asosiy web-server sifatida), Celery esa `CELERY_TASK_ALWAYS_EAGER=True` orqali
sinxron ishlaydi (alohida worker shart emas).

1. Tashqi bepul PostgreSQL oling — masalan [neon.tech](https://neon.tech) yoki
   [supabase.com](https://supabase.com) — va ulanish satrini (`postgres://user:pass@host/db`)
   nusxalab oling.
2. Repozitoriyni GitHub'ga push qiling.
3. Render Dashboard → **Blueprints** → **New Blueprint Instance** → shu repo'ni tanlang
   (`render.yaml` avtomatik o'qiladi).
4. So'raladigan maxfiy qiymatlarni kiriting:
   - `DATABASE_URL` — 1-qadamdagi Postgres ulanish satri
   - `BOT_TOKEN` — [@BotFather](https://t.me/BotFather)dan olingan token
5. **Apply** bosing — Render `edunest-backend` (web) va `edunest-redis`ni yaratadi va deploy qiladi.
6. Deploy tugagach backend URL (masalan `https://edunest-backend.onrender.com`) orqali
   `/api/docs/` ochib tekshiring; Telegram botga `/start` yozib sinang.
7. Frontendni ham deploy qilmoqchi bo'lsangiz, `frontend/js/config.js` ichidagi
   `API_BASE_URL`ni shu Render URL'ga o'zgartirib, frontend'ni Render Static Site
   (bepul) yoki GitHub Pages orqali joylashtiring.

To'liq qadamlar TZ hujjatining 8-bo'limida yozilgan.

## Tekshirilgan (ishlayotgani tasdiqlangan)

- `python manage.py check` — xatosiz
- `python manage.py migrate` — barcha apps uchun muvaffaqiyatli
- `POST /api/auth/register/`, `POST /api/auth/login/`, `GET /api/auth/me/` — JWT auth ishlayapti
- `GET /api/courses/` — ochiq (public) ro'yxat qaytaradi
- `POST /api/telegram/link-token/` va `POST /api/telegram/link/` — bot↔backend bog'lash oqimi ishlayapti
- `GET /api/docs/` — Swagger UI ochiladi
- Bot fayllari (`bot/*.py`) sintaksis jihatdan tekshirildi (`py_compile`)

## Keyingi qadamlar (o'zingiz to'ldirishingiz kerak bo'lgan qismlar)

- `payments/views.py` — Click/Payme haqiqiy checkout API integratsiyasi (hozir stub)
- Frontend (HTML/CSS/JS) — kurs sahifalari, login/ro'yxatdan o'tish formalari
- `ai_recommend/recommend.py` — kengaytirilgan tavsiya algoritmi yoki tashqi AI API
- Testlar (`pytest`/`Django TestCase`)
