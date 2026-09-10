#!/bin/sh
set -e

cd /app/backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput
cd /app

PORT="${PORT:-8000}"

# Bot backend bilan bir konteynerda ishlagani uchun uni ichki (localhost) manzil orqali chaqiradi
export API_BASE_URL="http://127.0.0.1:${PORT}"

if [ -n "$BOT_TOKEN" ]; then
    echo "Telegram bot fon jarayonida ishga tushirilmoqda..."
    (cd /app/bot && python main.py) &
else
    echo "BOT_TOKEN topilmadi — Telegram bot ishga tushirilmadi."
fi

cd /app/backend
exec daphne -b 0.0.0.0 -p "${PORT}" config.asgi:application
