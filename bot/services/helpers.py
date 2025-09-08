import os, aiohttp, tempfile
from aiogram import types

async def download_file(url: str, tmpdir: str) -> str:
    """Скачать файл по ссылке и вернуть путь до временного файла"""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            if resp.status != 200:
                raise Exception(f"Не удалось скачать {url}, status={resp.status}")
            suffix = os.path.splitext(url)[-1]
            path = os.path.join(tmpdir, next(tempfile._get_candidate_names()) + suffix)
            with open(path, "wb") as f:
                f.write(await resp.read())
            return path
        
async def prepare_file(url: str, tmpdir: str) -> str:
    """Определяет, нужно ли качать файл, или можно отправить ссылку"""
    if "localhost" in url or "127.0.0.1" in url:
       path = await download_file(url, tmpdir)
       return types.FSInputFile(path)
    return url

