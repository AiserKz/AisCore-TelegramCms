import importlib, sys, aiohttp
from aiogram import Dispatcher, types, Router
from .services.config import API_URL
from .services.user_log import log_admin_info
from types import ModuleType

plugins_root: Router | None = None
loaded_plugins: dict[str, ModuleType] = {}
loaded_routers: dict[str, Router] = {}

def ensure_plugins_root(dp: Dispatcher) -> Router:
    global plugins_root
    if plugins_root is None:
        plugins_root = Router(name="plugins_root")
        dp.include_router(plugins_root)
        print("[BOT] plugins_root подключён")
    return plugins_root


# ================== Динамические команды ==================

async def fetch_commands(name):
    """Получаем команды из API/БД"""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/commands/{name}") as resp:
            return await resp.json()

async def load_dynamic_commands(name):
    """Обновляем словарь динамических команд"""
    global dynamic_commands
    commands = await fetch_commands(name)
    dynamic_commands = {cmd["name"].lstrip("/"): cmd["response"] for cmd in commands}
    print(f"[BOT] Загружено {len(dynamic_commands)} динамических команд")
    

# Один глобальный хендлер для всех динамических команд
async def dynamic_handler(message: types.Message):
    cmd_name = message.text.lstrip("/")
    if cmd_name in dynamic_commands:
        await message.reply(
            dynamic_commands[cmd_name],
            parse_mode="Markdown"
        )
        # await log_admin_info(f"Пользователь с id {message.from_user.id} имя {message.from_user.first_name or message.from_user.username} использовал команду {cmd_name}")

# ================== Плагины бота ==================
async def fetch_enabled_plugins(name: str):
    async with aiohttp.ClientSession() as s:
        async with s.get(f"{API_URL}/plugins/{name}") as resp:
            return await resp.json()

async def load_bot_plugins(dp: Dispatcher, reload=False, name=None):
    root = ensure_plugins_root(dp)
    plugins = await fetch_enabled_plugins(name)
    active_names = {p["name"] for p in plugins}

    # выгружаем/перезагружаем
    if reload:
        for module_name, module in list(loaded_plugins.items()):
            short = module_name.split(".")[-1]

            # отключён → удалить
            if short not in active_names:
                router = loaded_routers.pop(module_name, None)
                if router:
                    if router in root.sub_routers:
                        root.sub_routers.remove(router)
                    # подчистить обработчики, чтобы не остались фантомы
                    router.message.handlers.clear()
                    router.callback_query.handlers.clear()
                    print(f"[BOT] Router плагина {short} удалён ❌")
                loaded_plugins.pop(module_name, None)
                sys.modules.pop(module_name, None)
                continue

            # активен → перезагрузить
            router = loaded_routers.pop(module_name, None)
            if router and router in root.sub_routers:
                root.sub_routers.remove(router)
                router.message.handlers.clear()
                router.callback_query.handlers.clear()
                print(f"[BOT] Router плагина {short} отключён для перезагрузки ♻️")

            # гарантированно свежий импорт
            sys.modules.pop(module_name, None)
            try:
                new_module = importlib.import_module(module_name)
                if hasattr(new_module, "build_router"):
                    new_router = new_module.build_router()
                    root.include_router(new_router)
                    loaded_plugins[module_name] = new_module
                    loaded_routers[module_name] = new_router
                    print(f"[BOT] Плагин {short} перезагружен 🔄✅")
            except Exception as e:
                print(f"[BOT] Ошибка при перезагрузке плагина {short}: {e}")

    # подключаем новые активные
    for p in plugins:
        module_name = f"bot.plugins.{p['name']}"
        if module_name in loaded_plugins:
            continue
        try:
            module = importlib.import_module(module_name)
            if hasattr(module, "build_router"):
                router = module.build_router()
                root.include_router(router)
                loaded_plugins[module_name] = module
                loaded_routers[module_name] = router
        except Exception as e:
            print(f"[BOT] Ошибка при подключении плагина {p['name']}: {e}")
            
    print("[DBG] plugins_root:", [getattr(r, "name", "noname") for r in root.sub_routers], f"[BOT] Подключено {len(loaded_plugins)} плагинов")

        
        
# ================== Перезагрузка всего ==================
async def reload_bot_plugins(dp: Dispatcher, name=None):
    """Перезагружаем плагины и динамические командыф"""
    print("[BOT] Перезагрузка плагинов и динамических команд... 🔄")
    await load_dynamic_commands(name)
    await load_bot_plugins(dp, reload=True, name=name)
    print("[BOT] Перезагрузка завершена ✅")
    

# ================== Регистрация глобального хендлера ==================
def register_global_handlers(dp: Dispatcher):
    """Регистрируем один глобальный хендлер после всех плагинов"""
    dp.message.register(dynamic_handler, lambda m: m.text.lstrip("/") in dynamic_commands)  # ловит только команды из dynamic_commands
