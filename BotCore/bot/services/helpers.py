import os, aiohttp, tempfile
from aiogram import types
from .config import DOCKER

async def download_file(url: str, tmpdir: str) -> str:
    """Скачать файл по ссылке и вернуть путь до временного файла"""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            if resp.status != 200:
                raise Exception(f"Не удалось скачать {url}, status={resp.status}")

            suffix = os.path.splitext(url.split("?")[0])[-1] or ""

            with tempfile.NamedTemporaryFile(suffix=suffix, dir=tmpdir, delete=False) as tmp:
                tmp.write(await resp.read())
                return tmp.name


async def prepare_file(url: str, tmpdir: str) -> types.FSInputFile:
    """
    Всегда скачивает файл и возвращает FSInputFile для передачи в Telegram.
    Это гарантирует корректную отправку (даже если URL приватный или без HTTPS).
    """
    # если localhost → заменяем на backend внутри docker
    if "localhost" in url or "127.0.0.1" in url:
        if DOCKER:
            url = url.replace("localhost:5002", "backend:5002")
            url = url.replace("127.0.0.1:5002", "backend:5002")

    path = await download_file(url, tmpdir)
    return types.FSInputFile(path)



def get_bot_name_from_message(message: types.Message) -> str:
    from ..main import bots
    bot = message.bot
    
    for name, data in bots.items():
        if data["bot"] == bot:
            return name

    return "unknown"

