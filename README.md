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
├── docker-compose.yml   # Lokal: db, redis, backend, celery_worker, celery_beat, bot
├── render.yaml          # Render.com blueprint (bitta fayldan bir zumda deploy)
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

## 3. Render.com'ga deploy

1. Repozitoriyni GitHub'ga push qiling.
2. Render Dashboard → **New +** → **Blueprint** → shu repo'ni tanlang (`render.yaml` avtomatik o'qiladi).
3. So'raladigan maxfiy qiymatlarni kiriting: `BOT_TOKEN`, `BOT_API_SECRET` (backend va bot uchun bir xil).
4. Render avtomatik ravishda quyidagilarni yaratadi: `edunest-backend` (web), `edunest-celery-worker`,
   `edunest-celery-beat`, `edunest-bot`, `edunest-redis`, `edunest-db` (Postgres).
5. Deploy tugagach backend URL orqali `/api/docs/` ochib tekshiring.

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
