import aiohttp, datetime
from aiogram import types
from .config import API_URL

async def log_telegram_user(message: types.Message):
    async with aiohttp.ClientSession() as session:
        await session.post(API_URL + "/log_user", json={
            "user_id": message.from_user.id,
            "chat_id": message.chat.id,
            "username": message.from_user.username,
            "first_name": message.from_user.first_name,
            "last_name": message.from_user.last_name,
            "language_code": message.from_user.language_code,
            "is_bot": message.from_user.is_bot
        })

async def log_admin_info(text: str, users: types.User = None):
    from ..main import admin_ids, bot, admin_debug
    if admin_ids and admin_debug:
        if users:
            text = f"{text}\n\n{users.first_name or ''} {users.last_name or ''} {users.username or ''} время: {datetime.datetime.now()}"
        for admin in admin_ids:
            await bot.send_message(admin, text)