import asyncio
from aiohttp import web
from aiogram import Bot, Dispatcher, types, BaseMiddleware
from aiogram.exceptions import TelegramAPIError, TelegramUnauthorizedError

from .plugin_loader import load_dynamic_commands, load_bot_plugins, register_global_handlers
from .services.user_log import log_telegram_user
from .web import setup_web_server

from contextlib import suppress


admin_debug = False
admin_ids = []
bots = {}

class AnalyticsMiddleware(BaseMiddleware):
    def __init__(self, bot_name: str):
        super().__init__()
        self.bot_name = bot_name
    
    async def __call__(self, handler, event, data):
        message = getattr(event, "message", None)
        if isinstance(message, types.Message):
            await log_telegram_user(message, self.bot_name)
        return await handler(event, data)


async def start_bot(bot_name: str, bot_token: str, config: dict):
    try:
        bot = Bot(token=bot_token)
        await bot.get_me()
    except TelegramUnauthorizedError:
        print(f"[BOT] Неверный токен для {bot_name} ❌")
        return
    except TelegramAPIError as e:
        print(f"[BOT] Ошибка при подключении {bot_name}: {e}")
        return

    dp = Dispatcher()
    
    dp.update.middleware.register(AnalyticsMiddleware(bot_name))
    await bot.delete_webhook(drop_pending_updates=True)

    await load_dynamic_commands(bot_name)
    await load_bot_plugins(dp, name=bot_name)
    register_global_handlers(dp, name=bot_name)

    task = asyncio.create_task(dp.start_polling(bot))

    bots[bot_name] = {"bot": bot, "dp": dp, "task": task, "config": config}

    print(f"[BOT] {bot_name} запущен ✅")

async def stop_bot(bot_name: str):
    if bot_name not in bots:
        return False

    bot_data = bots[bot_name]
    dp = bot_data["dp"]
    bot = bot_data["bot"]
    task = bot_data["task"]

    await dp.stop_polling()

    task.cancel()
    with suppress(asyncio.CancelledError):
        await task

    await bot.session.close()

    del bots[bot_name]
    print(f"[BOT] {bot_name} остановлен ⏹️")
    return True

async def main():
    """Главный цикл контейнера"""
    runner = web.AppRunner(setup_web_server())
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8082)
    await site.start()
    print("[BOT] API запущен на http://0.0.0.0:8082")

    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
