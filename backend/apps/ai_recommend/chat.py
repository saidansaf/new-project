import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

SYSTEM_PROMPT = (
    "Siz EduNest — online ta'lim platformasi uchun yordamchi AI'siz. "
    "Foydalanuvchilarga kurslar, platforma imkoniyatlari va o'quv jarayoni bo'yicha "
    "qisqa, aniq va o'zbek tilida javob bering. Agar savol platformaga aloqador bo'lmasa, "
    "baribir foydali javob berishga harakat qiling, lekin qisqa bo'ling."
)


class GroqError(Exception):
    pass


def ask_groq(message: str, history: list[dict] | None = None) -> str:
    if not settings.GROQ_API_KEY:
        raise GroqError("GROQ_API_KEY sozlanmagan.")

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for item in (history or [])[-6:]:  # oxirgi bir necha xabarni kontekst sifatida beramiz
        if item.get('role') in ('user', 'assistant') and item.get('content'):
            messages.append({'role': item['role'], 'content': str(item['content'])[:2000]})
    messages.append({'role': 'user', 'content': message[:2000]})

    try:
        response = requests.post(
            GROQ_URL,
            headers={
                'Authorization': f'Bearer {settings.GROQ_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': settings.GROQ_MODEL,
                'messages': messages,
                'temperature': 0.6,
                'max_tokens': 500,
            },
            timeout=20,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.error('Groq API xatosi: %s', exc)
        raise GroqError("AI xizmati bilan bog'lanishda xatolik yuz berdi.") from exc

    data = response.json()
    try:
        return data['choices'][0]['message']['content'].strip()
    except (KeyError, IndexError) as exc:
        raise GroqError("AI javobini o'qib bo'lmadi.") from exc
