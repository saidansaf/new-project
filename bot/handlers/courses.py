from aiogram import Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from api_client import api
from keyboards import courses_pagination_keyboard

router = Router(name='courses')


def _format_courses_page(data: dict) -> str:
    courses = data.get('results', [])
    if not courses:
        return "Hozircha tasdiqlangan kurslar yo'q."

    lines = ["📚 <b>Kurslar</b>\n"]
    for course in courses:
        price = "Bepul" if float(course['price']) == 0 else f"{course['price']} so'm"
        rating = course.get('average_rating')
        rating_str = f" ⭐ {rating}" if rating else ''
        lines.append(f"• <b>{course['title']}</b> — {price}{rating_str}")
    return '\n'.join(lines)


async def _send_courses_page(target_message: Message, page: int):
    data = await api.list_courses(page=page)
    text = _format_courses_page(data)
    keyboard = courses_pagination_keyboard(
        page=page, has_next=bool(data.get('next')), has_prev=bool(data.get('previous'))
    )
    await target_message.answer(text, reply_markup=keyboard)


@router.message(Command('courses'))
async def cmd_courses(message: Message):
    await _send_courses_page(message, page=1)


@router.callback_query(lambda c: c.data and c.data.startswith('courses:'))
async def cb_courses_page(callback: CallbackQuery):
    page = int(callback.data.split(':')[1])
    await _send_courses_page(callback.message, page=page)
    await callback.answer()
