import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from api_client import api
from config import BOT_TOKEN
from handlers import courses, start

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()

    dp.include_router(start.router)
    dp.include_router(courses.router)

    logger.info('EduNest Telegram bot ishga tushdi (polling rejimi)')
    try:
        await dp.start_polling(bot)
    finally:
        await api.close()
        await bot.session.close()


if __name__ == '__main__':
    asyncio.run(main())
