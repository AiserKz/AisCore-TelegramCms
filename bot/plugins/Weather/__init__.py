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
    router = Router(name="Weather")
    config = get_config()
    comand_names = [cmd['name'].lstrip('/') for cmd in config.get("commands", [])]

    @router.message(Command(commands=comand_names)) 
    async def weather_handler(message: types.Message):
        text = message.text.strip()
        parts = text.split(maxsplit=1)
        commands = config.get("commands", [])

        for cmd in commands:
            if parts[0] == cmd["name"]:   # строгая проверка
                if len(parts) < 2:
                    await message.answer(
                        f"⚠️ Укажите город, например: {cmd['name']} {config.get('city', 'Алматы')}"
                    )
                    return

                city = parts[1]
                await execute_command(cmd, message, city)
                return

    return router


async def execute_command(cmd: dict, message: types.Message, city: str):
    action = cmd.get("action")
    config = get_config()

    if action == "text":
        await message.answer(cmd.get("response", ""))
        return

    elif action == "void":
        method_path = cmd.get("method")
        if not method_path:
            await message.answer("⚠️ Метод не указан в конфиге")
            return

        try:
            module_name, func_name = method_path.split(".", 1)
            module = import_module(f".{module_name}", package=__name__)
            func = getattr(module, func_name)

            api_key = config.get("api_key")
            units = config.get("units")
            lang = config.get("lang")

            if not api_key or not units or not lang:
                await user_log("⚠️ Не заданы настройки плагина Weather", message.from_user)
                return

            # Проверяем тип функции
            if callable(func):
                if inspect.iscoroutinefunction(func):
                    result = await func(city, api_key, units, lang)
                else:
                    result = func(city, api_key, units, lang)

                if result:
                    await message.answer(result, parse_mode="HTML")
            else:
                await user_log(f"⚠️ {func_name} не является функцией", message.from_user)

        except Exception as e:
            await user_log(f"Ошибка при выполнении команды: {e}", message.from_user)
