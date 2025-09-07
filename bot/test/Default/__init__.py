import json
import os
from aiogram import Router, types

from aiogram.filters import Command
from importlib import import_module
import inspect

PLUGIN_DIR = os.path.dirname(__file__)
OPTIONS_PATH = os.path.join(PLUGIN_DIR, "config")
CONFIG_PATH = os.path.join(OPTIONS_PATH, "config.json")
SCHEMA_PATH = os.path.join(OPTIONS_PATH, "schema.json")


# ================= Конфиг =================

async def user_log(text: str, users: types.User = None):
    from ...services.user_log import log_admin_info
    await log_admin_info(text, users)

def deep_update(original: dict, updates: dict) -> dict:
    """Рекурсивно обновляет original значениями из updates"""
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(original.get(key), dict):
            original[key] = deep_update(original.get(key, {}), value)
        else:
            original[key] = value
    return original


def get_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"cooldown": 0, "commands": [], "is_allMessages": False}


def set_config(new_config):
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            current = json.load(f)
    else:
        current = {}
    updated = deep_update(current, new_config)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)


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
    """
    Возвращает Router для подключения в plugin_loader.
    Не трогает dp напрямую!
    """
    router = Router(name="Weather")
    config = get_config()
    comand_names = [cmd['name'].lstrip('/') for cmd in config.get("commands", [])]

    @router.message(Command(commands=comand_names)) 
    async def webapp_handler(message: types.Message):
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
    action = cmd.get("action")
    config = get_config()
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
            url = config.get("url")
            title = config.get("title")
            from ...main import bot
            if callable(func):
                # если метод асинхронный — await, если синхронный — просто вызов
                if inspect.iscoroutinefunction(func):
                    result = await func(bot, url, title)
                else:
                    result = func(bot, url, title)
                
                if result:
                    await message.answer("Нажмите на кнопку", reply_markup=[])
                # else: 
                #     await message.answer(f"⚠️ Не заданые настройки плагина WebAppButton", reply_markup=types.ReplyKeyboardRemove())
            else:
                await user_log(f"⚠️ {func_name} не является функцией", message.from_user)
        except Exception as e:
            await user_log(f"Ошибка при выполнении команды: {e}", message.from_user)
