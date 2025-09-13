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
            path = os.path.join(tmpdir, next(tempfile._get_candidate_names()) + suffix)
            
            with open(path, "wb") as f:
                f.write(await resp.read())
            
            return path


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

