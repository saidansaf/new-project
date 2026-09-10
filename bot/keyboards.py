from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def main_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="📚 Kurslar", callback_data='courses:1')],
            [InlineKeyboardButton(text="ℹ️ Yordam", callback_data='help')],
        ]
    )


def courses_pagination_keyboard(page: int, has_next: bool, has_prev: bool) -> InlineKeyboardMarkup:
    buttons = []
    row = []
    if has_prev:
        row.append(InlineKeyboardButton(text='⬅️ Oldingi', callback_data=f'courses:{page - 1}'))
    if has_next:
        row.append(InlineKeyboardButton(text='Keyingi ➡️', callback_data=f'courses:{page + 1}'))
    if row:
        buttons.append(row)
    return InlineKeyboardMarkup(inline_keyboard=buttons)
