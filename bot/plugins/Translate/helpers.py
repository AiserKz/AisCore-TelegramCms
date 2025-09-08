from aiogram import types
from googletrans import Translator

async def translator(message: types.Message, cmd: dict):
    text = message.text.split(maxsplit=1)[1]
    translate = Translator()
    result = await translate.translate(text, dest="en")
    return result.text
