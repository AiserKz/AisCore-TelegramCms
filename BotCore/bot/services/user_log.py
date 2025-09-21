import aiohttp, datetime
from aiogram import types
from .config import API_URL

async def log_telegram_user(message: types.Message, bot_name):
    user: types.User | None = message.from_user
    chat: types.Chat | None = message.chat
    
    if not user or not chat:
        return None
    
    async with aiohttp.ClientSession() as session:
        await session.post(API_URL + "/log_user", json={
            "user_id": user.id,
            "chat_id": chat.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "language_code": user.language_code,
            "is_bot": user.is_bot,
            "bot_name": bot_name,
        })

async def log_admin_info(bot_name: str, text: str, users: types.User | None = None): 
    from ..main import bots
    if bot_name not in bots:
        return None
    bot_data = bots[bot_name]
    bot = bot_data["bot"]
    config = bot_data["config"]

    admin_ids = config.get("notifyChatIds", [])
    admin_debug = config.get("enableNotifications", False)

    if admin_ids and admin_debug:
        if users:
            text = (
                f"{text}\n\n"
                f"{users.first_name or ''} {users.last_name or ''} "
                f"@{users.username or ''} "
                f"время: {datetime.datetime.now():%Y-%m-%d %H:%M:%S}"
            )
        for admin in admin_ids:
            try:
                await bot.send_message(admin, text)
            except Exception as e:
                print(f"[ERROR] Не удалось отправить лог админу {admin}: {e}")