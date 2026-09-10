import httpx

from config import API_BASE_URL, BOT_API_SECRET


class EduNestAPI:
    """Django backend (DRF) bilan gaplashuvchi yengil HTTP klient."""

    def __init__(self):
        self._client = httpx.AsyncClient(base_url=API_BASE_URL, timeout=10)

    async def close(self):
        await self._client.aclose()

    async def list_courses(self, page: int = 1) -> dict:
        response = await self._client.get('/api/courses/', params={'page': page})
        response.raise_for_status()
        return response.json()

    async def link_account(self, token: str, chat_id: int, username: str = '') -> dict | None:
        response = await self._client.post(
            '/api/telegram/link/',
            json={'token': token, 'chat_id': chat_id, 'username': username},
            headers={'X-Bot-Secret': BOT_API_SECRET},
        )
        if response.status_code != 200:
            return None
        return response.json()


api = EduNestAPI()
