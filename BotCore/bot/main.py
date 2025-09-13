import asyncio, requests
from aiohttp import web
from aiogram import Bot, Dispatcher, types, BaseMiddleware
from contextlib import suppress

from .plugin_loader import load_dynamic_commands, load_bot_plugins, register_global_handlers
from .services.user_log import log_telegram_user
from .web import setup_web_server, bot_init
from .services.config import API_URL


bot = None
dp = None
name = None
admin_debug = False
admin_ids = []
is_Run = False


class AnalyticsMiddleware(BaseMiddleware):
    async def __call__(self, handler, event, data):
        message = getattr(event, "message", None)
        if isinstance(message, types.Message):
            await log_telegram_user(message)
        return await handler(event, data)


async def start_bot():
    """Запуск текущего активного бота"""
    global bot, dp, name, admin_debug, admin_ids, is_Run

    data = bot_init()
    if not data:
        print("[BOT] Нет активного бота в базе")
        return

    bot = Bot(token=data["bot_token"])
    dp = Dispatcher()
    name = data["bot_name"]
    admin_debug = data["config"].get("enableNotifications", False)
    admin_ids = data["config"].get("notifyChatIds", [])

    dp.update.middleware.register(AnalyticsMiddleware())

    await bot.delete_webhook(drop_pending_updates=True)

    await load_dynamic_commands(name)
    await load_bot_plugins(dp, name=name)
    register_global_handlers(dp)
    is_Run = True
    print(f"[BOT] {name} запущен ✅")
    await dp.start_polling(bot)


async def main():
    """Главный цикл контейнера"""
    runner = web.AppRunner(setup_web_server())
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8082)
    await site.start()
    print("[BOT] API запущен на http://0.0.0.0:8082")

    while True:
        await asyncio.sleep(5)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        with suppress(Exception):
            if bot:
                asyncio.run(bot.session.close())
        print("[BOT] Остановлен")
        try:
            data = bot_init()
            bot_name = data["bot_name"] if data else None
            if bot_name:
                requests.post(f"{API_URL}/stop/{bot_name}", timeout=5)
        except Exception as e:
            print(f"[BOT] Ошибка уведомления backend: {e}")