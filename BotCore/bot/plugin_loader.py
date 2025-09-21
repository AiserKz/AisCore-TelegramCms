import importlib, sys, aiohttp, os, json, subprocess, sys, re
from aiogram import Dispatcher, types, Router
from .services.config import API_URL
from .services.user_log import log_admin_info
from types import ModuleType
from collections import defaultdict
from aiogram.filters import BaseFilter

bots_state = {}


def get_bot_state(name: str):
    if name not in bots_state:
        bots_state[name] = {
            "dynamic_commands": {},
            "plugins_root": None,
            "loaded_plugins": {},
            "loaded_routers": {}
        }
    return bots_state[name]

class DynamicCommandFilter(BaseFilter):
    def __init__(self, bot_name: str):
        self.bot_name = bot_name
    
    async def __call__(self, message: types.Message) -> bool:
        state = get_bot_state(self.bot_name)
        if not message.text:
            return False
        cmd_name = message.text.lstrip("/")
        return cmd_name in state["dynamic_commands"]

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
    return conflicts, deps # type: ignore


async def install_missing_dependencies(deps: dict, name: str):
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
                    await log_admin_info(name, f"Ошибка при установке зависимости {package_spec}: {e}")
                    return
        else:
            print(f"[BOT] не удалось установить зависимость: {package_spec} {pkg}")


# ================== Создание роутера ==================

def ensure_plugins_root(dp: Dispatcher, name: str) -> Router:
    state = get_bot_state(name)
    if state["plugins_root"] is None:
        state["plugins_root"] = Router(name=f"plugins_root_{name}")
        dp.include_router(state["plugins_root"])
        print(f"[BOT {name}] plugins_root подключён")
    return state["plugins_root"]


# ================== Динамические команды ==================

async def fetch_commands(name):
    """Получаем команды из API/БД"""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/commands/{name}") as resp:
            return await resp.json()

async def load_dynamic_commands(name):
    """Обновляем словарь динамических команд"""
    state = get_bot_state(name)
    commands = await fetch_commands(name)
    state["dynamic_commands"] = {cmd["name"].lstrip("/"): cmd["response"] for cmd in commands}
    # dynamic_commands = {cmd["name"].lstrip("/"): cmd["response"] for cmd in commands}
    print(f"[BOT {name}] Загружено {len(state['dynamic_commands'])} динамических команд")
    


async def dynamic_handler(message: types.Message, name: str):
    state = get_bot_state(name)
    if not message.text:
        return
    cmd_name = message.text.lstrip("/")
    if cmd_name in state["dynamic_commands"]:
        await message.reply(state["dynamic_commands"][cmd_name], parse_mode="Markdown")
        # await log_admin_info(f"Пользователь с id {message.from_user.id} имя {message.from_user.first_name or message.from_user.username} использовал команду {cmd_name}")

# ================== Плагины бота ==================
async def fetch_enabled_plugins(name: str):
    async with aiohttp.ClientSession() as s:
        async with s.get(f"{API_URL}/plugins/{name}") as resp:
            return await resp.json()

async def load_bot_plugins(dp: Dispatcher, reload=False, name=''):
    state = get_bot_state(name)
    root = ensure_plugins_root(dp, name)
    plugins = await fetch_enabled_plugins(name)
    active_names = {p["name"] for p in plugins}
    
    conflicts, deps = check_dependencies(list(active_names))
    if conflicts:
        msg = "\n".join(
            f"{pkg}: {', '.join(f'{n} ({v})' for n, v in vers)}"
            for pkg, vers in conflicts.items()
        )
        print(f"[BOT] Возникли конфликты зависимостей:\n{msg}. Могут быть проблемы в работе плагина бота. рекемендуем отключить один или несколько плагинов.")
        await log_admin_info(name, f"Возникли конфликты зависимостей:\n{msg}. Могут быть проблемы в работе плагина бота. рекемендуем отключить один или несколько плагинов.")
    await install_missing_dependencies(deps, name)
    
    # выгружаем/перезагружаем
    if reload:
        if state["plugins_root"]:
            dp.sub_routers.remove(state["plugins_root"])
            state["plugins_root"] = None
            state["loaded_plugins"].clear()
            state["loaded_routers"].clear()

        # Создаём новый root
        root = ensure_plugins_root(dp, name)
        
        for module_name, module in list(state["loaded_plugins"].items()):
            short = module_name.split(".")[-1]

            # отключён → удалить
            if short not in active_names:
                router = state["loaded_routers"].pop(module_name, None)
                if router:
                    if router in root.sub_routers:
                        root.sub_routers.remove(router)
                    # подчистить обработчики, чтобы не остались фантомы
                    router.message.handlers.clear()
                    router.callback_query.handlers.clear()
                    print(f"[BOT] Router плагина {short} удалён ❌")
                state["loaded_plugins"].pop(module_name, None)
                sys.modules.pop(module_name, None)
                continue

            # активен → перезагрузить
            router = state["loaded_routers"].pop(module_name, None)
            if router and router in root.sub_routers:
                root.sub_routers.remove(router)
                router.message.handlers.clear()
                router.callback_query.handlers.clear()
                print(f"[BOT] Router плагина {short} отключён для перезагрузки ♻️")

            # гарантированно свежий импорт
            unload_module(module_name)
            try:
                new_module = importlib.import_module(module_name)
                if hasattr(new_module, "build_router"):
                    new_router = new_module.build_router()
                    root.include_router(new_router)
                    state["loaded_plugins"][module_name] = new_module
                    state["loaded_routers"][module_name] = new_router
                    print(f"[BOT] Плагин {short} перезагружен 🔄✅")
            except Exception as e:
                print(f"[BOT] Ошибка при перезагрузке плагина {short}: {e}")
                await log_admin_info(name, f"Ошибка при перезагрузке плагина {short}: {e}")

    # подключаем новые активные
    for p in plugins:
        module_name = f"bot.plugins.{p['name']}"
        if module_name in state["loaded_plugins"]:
            continue
        try:
            module = importlib.import_module(module_name)
            if hasattr(module, "build_router"):
                router = module.build_router()
                root.include_router(router)
                state["loaded_plugins"][module_name] = module
                state["loaded_routers"][module_name] = router
        except Exception as e:
            print(f"[BOT] Ошибка при подключении плагина {p['name']}: {e}")
            await log_admin_info(name, f"Ошибка при подключении плагина {p['name']}: {e}")
            
    print("[DBG] plugins_root:", [getattr(r, "name", "noname") for r in root.sub_routers], f"[BOT] Подключено {len(state['loaded_plugins'])} плагинов")

def unload_module(module_name: str):
    for m in list(sys.modules.keys()):
        if m == module_name or m.startswith(module_name + "."):
            sys.modules.pop(m, None)
        
        
# ================== Перезагрузка всего ==================
async def reload_bot_plugins(dp: Dispatcher, name:str = ''):
    """Перезагружаем плагины и динамические командыф"""
    print("[BOT] Перезагрузка плагинов и динамических команд... 🔄")
    await load_dynamic_commands(name)
    await load_bot_plugins(dp, reload=True, name=name)
    print("[BOT] Перезагрузка завершена ✅")
    

# ================== Регистрация глобального хендлера ==================

def register_global_handlers(dp: Dispatcher, name: str):
    """Регистрируем глобальный хендлер после всех плагинов"""

    async def wrapper(msg: types.Message, bot_name=name):
        await dynamic_handler(msg, bot_name)

    dp.message.register(wrapper, DynamicCommandFilter(name))
    print(f"[BOT {name}] Глобальный хендлер динамических команд зарегистрирован ✅")
