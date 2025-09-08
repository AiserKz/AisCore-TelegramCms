import importlib, sys, aiohttp, os, json, subprocess, sys, re
from aiogram import Dispatcher, types, Router
from .services.config import API_URL
from .services.user_log import log_admin_info
from types import ModuleType
from collections import defaultdict

plugins_root: Router | None = None
loaded_plugins: dict[str, ModuleType] = {}
loaded_routers: dict[str, Router] = {}


# ================= Конфиг зависимостей =================

def parse_dependecy(dep: str):
    match = re.match(r"([a-zA-Z0-9_\-]+)\s*([=<>!]+)?\s*([\d\.]+)?", dep)
    if not match:
        return dep, None, None
    pkg, op, ver = match.groups()
    return pkg, op or None, ver or None

def read_plugin_meta(plugin_name: str) -> dict:
    """Читаем метаданные плагина"""
    path = os.path.join("bot", "plugins", plugin_name, "plugin.json")
    if not os.path.exists(path):
        return {"name": plugin_name, "dependencies": []}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def check_dependencies(active_plugins: list[str]) -> dict:
    """Собираем зависимости плагинов"""
    deps = defaultdict(list)
    for name in active_plugins:
        meta = read_plugin_meta(name)
        for dep in meta.get("dependencies", []):
            pkg, _, ver = parse_dependecy(dep)
            deps[pkg].append((name, ver or "*"))
    
    conflicts = {pkg: vers for pkg, vers in deps.items() if len(set(v for _, v in vers if v != "*")) > 1}
    return conflicts, deps


async def install_missing_dependencies(deps: dict):
    """Устанавливаем зависимости"""
    for pkg, vers in deps.items():
        version = next((v for _, v in vers if v != "*"), None)
        package_spec = f"{pkg}=={version}" if version else pkg
        if pkg:
            try:
                print(f"[BOT] Проверяю зависимость: {package_spec}")
                __import__(pkg)
            except ImportError:
                print(f"[BOT] Устанавливаю зависимость: {package_spec}")
                try:
                    subprocess.check_call([sys.executable, "-m", "pip", "install", package_spec])
                except subprocess.CalledProcessError as e:
                    print(f"[BOT] ❌ Не удалось установить {package_spec}: {e}")
                    await log_admin_info(f"Ошибка при установке зависимости {package_spec}: {e}")
                    return
        else:
            print(f"[BOT] не удалось установить зависимость: {package_spec} {pkg}")


# ================== Создание роутера ==================

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
    
    conflicts, deps = check_dependencies(list(active_names))
    if conflicts:
        msg = "\n".join(
            f"{pkg}: {', '.join(f'{n} ({v})' for n, v in vers)}"
            for pkg, vers in conflicts.items()
        )
        await log_admin_info(f"Возникли конфликты зависимостей:\n{msg}")
    await install_missing_dependencies(deps)
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
                await log_admin_info(f"Ошибка при перезагрузке плагина {short}: {e}")

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
            await log_admin_info(f"Ошибка при подключении плагина {p['name']}: {e}")
            
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
