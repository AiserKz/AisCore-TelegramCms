from aiogram import types

def sample_method(message: types.Message, cmd: dict):
    return f"Вы вызвали метод из плагина {cmd['name']}"
