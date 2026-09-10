import os

from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN', '')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000').rstrip('/')
BOT_API_SECRET = os.getenv('BOT_API_SECRET', 'change-me-bot-secret')

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN aniqlanmagan. .env faylida BOT_TOKEN ni sozlang.")
