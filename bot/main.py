import asyncio
from aiohttp import web
from aiogram import Bot, Dispatcher, types, BaseMiddleware
from .plugin_loader import load_bot_plugins, load_dynamic_commands, register_global_handlers
from .services.user_log import log_telegram_user
from .web import setup_web_server, bot_init
from contextlib import suppress

data = bot_init()

if not data:
    print("[BOT] Не удалось инициализировать бота данные отсутствуют")
    raise Exception

bot = Bot(token=data['bot_token'])
dp = Dispatcher()
name = data['bot_name']
admin_debug = data['config']['enableNotifications'] or False
admin_ids = data['config']['notifyChatIds']


class AnalyticsMiddleware(BaseMiddleware):
    async def __call__(self, handler, event, data):
        # проверяем, что это сообщение
        message = getattr(event, "message", None)
        if isinstance(message, types.Message):
            await log_telegram_user(message)  # ваша функция логирования
        # вызываем следующий хендлер
        return await handler(event, data)
    
dp.update.middleware.register(AnalyticsMiddleware())



async def restart_bot():
    global bot, dp, name, admin_debug, admin_ids
    print("[BOT] Перезагрузка бота... 🔄")
    
    with suppress(Exception):
        await bot.session.close()
        
    data = bot_init()
    if not data:
        print("[BOT] Не удалось инициализировать бота данные отсутствуют")
        raise Exception
    
    
    bot = Bot(token=data['bot_token'])
    dp = Dispatcher()
    name = data['bot_name']
    admin_debug = data['config']['enableNotifications'] or False
    admin_ids = data['config']['notifyChatIds']
    
    dp.update.middleware.register(AnalyticsMiddleware())
    
    
    await load_dynamic_commands(name)
    await load_bot_plugins(dp, name=name)
    register_global_handlers(dp)
    print(f"[BOT] ✅ Перезапуск завершён. Работает с именем {name}")


# ================== Главная функция ==================
async def main():
    global bot

    await bot.delete_webhook(drop_pending_updates=True)
    
    # Первичная загрузка
    await load_dynamic_commands(name)
    await load_bot_plugins(dp, name=name)
    register_global_handlers(dp)
    # Запуск HTTP API
    runner = web.AppRunner(setup_web_server())
    await runner.setup()
    site = web.TCPSite(runner, "127.0.0.1", 8081)
    await site.start()
    print("[BOT] API запущен на http://127.0.0.1:8081")

    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())