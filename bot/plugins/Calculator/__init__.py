import json, os, time, inspect
from aiogram import Router, types
from aiogram.enums import ParseMode
from aiogram.filters import Command
from importlib import import_module


PLUGIN_DIR = os.path.dirname(__file__)
OPTIONS_PATH = os.path.join(PLUGIN_DIR, "config")
CONFIG_PATH = os.path.join(OPTIONS_PATH, "config.json")
SCHEMA_PATH = os.path.join(OPTIONS_PATH, "schema.json")

_last_used = {}
_config_cache = None

# ================= Конфиг =================

async def user_log(text: str, users: types.User = None):
    from ...services.user_log import log_admin_info
    await log_admin_info(text, users)

def deep_update(original: dict, updates: dict) -> dict:
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(original.get(key), dict):
            original[key] = deep_update(original.get(key, {}), value)
        else:
            original[key] = value
    return original

def get_config():
    global _config_cache
    if _config_cache is None and os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            _config_cache = json.load(f)
    return _config_cache or {"cooldown": 0, "commands": []}

def set_config(new_config):
    global _config_cache
    current = get_config()
    updated = deep_update(current, new_config)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)
    _config_cache = updated

def get_schema():
    if os.path.exists(SCHEMA_PATH):
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema = json.load(f)
            return schema.get("fields", [])
    return []

def get_data():
    return {"config": get_config(), "fields": get_schema()}

def set_data(data):
    options = data.get("config", {})
    if options:
        set_config(options)
    return "ok"

# ================== Router Builder ==================
def build_router() -> Router:
    router = Router(name="calculator")
    config = get_config()
    comand_names = [cmd['name'].lstrip('/') for cmd in config.get("commands", [])]

    @router.message(Command(commands=comand_names)) 
    async def calc_handler(message: types.Message):
        text = message.text.strip()
        commands = config.get("commands", [])
        # проверяем команды из конфига
        for cmd in commands:
            if text.startswith(cmd["name"]):
                await execute_command(cmd, message)
                return
    return router


# ================== Движок команд ==================
async def execute_command(cmd: dict, message: types.Message):
    config = get_config()
    
    cooldown = cmd.get("cooldown", config.get("cooldown", 0))
    key = f"{message.from_user.id}:{cmd['name']}"
    now = time.time()
    
    if cooldown and key in _last_used and now - _last_used[key] < cooldown:
        await message.answer("⏳ Подождите перед следующим использованием этой команды")
        return
    
    _last_used[key] = now
    
    action = cmd.get("action")
    if action == "text":
        await message.answer(cmd.get("response", ""))

    elif action == "void":
        method_path = cmd.get("method")
        if not method_path:
            await message.answer("⚠️ Метод не указан в конфиге")
            return

        try:
            module_name, func_name = method_path.split(".", 1)
            module = import_module(f".{module_name}", package=__name__)
            func = getattr(module, func_name)

            if callable(func):
                # если метод асинхронный — await, если синхронный — просто вызов
                if inspect.iscoroutinefunction(func):
                    result = await func(message, cmd)
                else:
                    result = func(message, cmd)

                if result:
                    await message.answer(str(result), parse_mode=ParseMode.HTML)
            else:
                await user_log(f"⚠️ {func_name} не является функцией", message.from_user)
        except Exception as e:
            await user_log(f"Ошибка в плагине {__name__}: {e}", message.from_user)
