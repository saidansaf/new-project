from aiogram import F, Router
from aiogram.filters import Command, CommandObject
from aiogram.types import Message

from api_client import api
from keyboards import main_menu_keyboard

router = Router(name='start')


@router.message(Command('start'))
async def cmd_start(message: Message, command: CommandObject):
    token = command.args  # https://t.me/EduNestBot?start=<token> orqali keladi

    if token:
        result = await api.link_account(
            token=token,
            chat_id=message.chat.id,
            username=message.from_user.username or '',
        )
        if result:
            await message.answer(
                f"✅ Salom, {result['full_name']}!\n"
                "Telegram akkauntingiz EduNest profilingizga muvaffaqiyatli bog'landi.\n"
                "Endi yangi darslar va bildirishnomalar shu yerga keladi.",
                reply_markup=main_menu_keyboard(),
            )
            return
        await message.answer(
            "⚠️ Bog'lash havolasi yaroqsiz yoki muddati o'tgan. "
            "Saytda \"Telegram botga ulash\" tugmasini qayta bosing."
        )
        return

    await message.answer(
        "👋 <b>EduNest</b> botiga xush kelibsiz!\n\n"
        "Bu yerda siz:\n"
        "📚 Kurslar katalogini ko'rishingiz\n"
        "🔔 Yangi darslar va to'lovlar haqida bildirishnoma olishingiz\n"
        "🎓 Sertifikat tayyor bo'lganda xabar olishingiz mumkin.\n\n"
        "Akkauntingizni bog'lash uchun saytdagi profil sahifasida "
        "\"Telegram botga ulash\" tugmasini bosing.",
        reply_markup=main_menu_keyboard(),
    )


@router.callback_query(F.data == 'help')
async def cb_help(callback):
    await callback.message.answer(
        "ℹ️ Buyruqlar:\n"
        "/start — botni ishga tushirish / akkauntni bog'lash\n"
        "/courses — kurslar ro'yxati"
    )
    await callback.answer()
