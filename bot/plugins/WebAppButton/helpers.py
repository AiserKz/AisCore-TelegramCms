from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup, MenuButtonWebApp, MenuButtonDefault
from aiogram import Bot
from . import user_log

def build_webapp_keyboard(url: str, title: str) -> InlineKeyboardMarkup:
    webapp_btn = KeyboardButton(
        text=title,
        web_app=WebAppInfo(url=url),
    )
    keyboard = ReplyKeyboardMarkup(
        keyboard=[[webapp_btn]],
        resize_keyboard=True,
        one_time_keyboard=False
    )
    return keyboard


async def set_webapp_menu_button(bot: Bot, url: str, title: str):
    if not url or not title:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonDefault()
        )
        await user_log(f"Не задано название или ссылка удаляем меню")
        return
    await user_log(f"Успешно установлено WebAppMenu {title} {url}")
    await bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text=title,
            web_app=WebAppInfo(url=url)
        )
    )