#!/bin/sh
set -e

# Argumentsiz chaqirilsa (web servis) — migratsiya + statik fayllar + ASGI server.
# Argument bilan chaqirilsa (celery worker/beat) — o'sha buyruq ishga tushadi.
if [ "$#" -eq 0 ]; then
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
    exec daphne -b 0.0.0.0 -p "${PORT:-8000}" config.asgi:application
else
    exec "$@"
fi
