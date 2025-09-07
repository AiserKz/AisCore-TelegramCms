import json
import os
from aiogram import Router, types
from .helpers import format_response
from importlib import import_module
import inspect

PLUGIN_DIR = os.path.dirname(__file__)
OPTIONS_PATH = os.path.join(PLUGIN_DIR, "config")
CONFIG_PATH = os.path.join(OPTIONS_PATH, "config.json")
SCHEMA_PATH = os.path.join(OPTIONS_PATH, "schema.json")


# ================= Конфиг =================
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
    router = Router(name="echo")

    @router.message(lambda m: bool(m.text))  # только если есть текст
    async def echo_handler(message: types.Message):
        text = message.text.strip()
        config = get_config()
        commands = config.get("commands", [])

        # проверяем команды из конфига
        for cmd in commands:
            if text.startswith(cmd["name"]):
                # response = format_response(cmd["response"])
                # await message.answer(response)
                await execute_command(cmd, message)
                return

        # fallback — если включен режим "ловить все"
        if config.get("is_allMessages", False):
            await message.answer(format_response(text))

    return router


# ================== Движок команд ==================
async def execute_command(cmd: dict, message: types.Message):
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
                    await message.answer(str(result))
            else:
                await message.answer(f"⚠️ {func_name} не является функцией")
        except Exception as e:
            await message.answer(f"⚠️ Ошибка при выполнении команды: {e}")
