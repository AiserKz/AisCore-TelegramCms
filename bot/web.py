import tempfile
from aiohttp import web
from aiogram.types import InputMediaPhoto
from .plugin_loader import reload_bot_plugins
from .services.helpers import prepare_file
from importlib import import_module
import requests
from .services.config import API_URL


# ================== HTTP API для админки ==================
async def handle_reload(request):
    from .main import dp
    name = request.match_info.get("bot_name")
    print(f"[API] Перезагрузка плагинов и команд для бота {name}")
    if not name: return print("[API] Название бота не указано")
    await reload_bot_plugins(dp, name=name)
    return web.json_response({"status": "ok", "message": "♻️ Плагины и команды перезагружены"})


async def handler_broadcast(request):
    from .main import bot
    data = await request.json()
    text = data.get("text")
    chat_ids = data.get("chat_ids", [])
    images = data.get("images", [])
    videos = data.get("videos", [])
    documents = data.get("documents", [])

    if not (text or images or videos or documents):
        return web.json_response({"status": "error", "message": "Нет содержимого"})

    if not chat_ids:
        return web.json_response({"status": "error", "message": "Список получателей пуст"})

    with tempfile.TemporaryDirectory() as tmpdir:
        for uid in chat_ids:
            try:
                # 1. Если есть альбом (фото+видео вместе)
                if len(images) + len(videos) > 1:
                    media = []
                    idx = 0
                    
                    for img in images:
                        idx += 1
                        file = await prepare_file(img, tmpdir)
                        media.append(
                            InputMediaPhoto(media=file, caption=text if idx == 1 and text else None)
                        )
                        
                    for vid in videos:
                        idx += 1
                        file = await prepare_file(vid, tmpdir)
                        media.append(
                            InputMediaPhoto(media=file, caption=text if idx == 1 and text else None)
                        )
                    await bot.send_media_group(uid, media=media)
                # 2. Одиночное фото
                elif len(images) == 1:
                    file = await prepare_file(images[0], tmpdir)
                    await bot.send_photo(uid, photo=file, caption=text or None)
                # 3. Одиночное видео
                elif len(videos) == 1:
                    file = await prepare_file(videos[0], tmpdir)
                    await bot.send_video(uid, video=file, caption=text or None)
                    
                # 4. Документы (по одному, альбома для них нет)
                elif documents:
                    for doc in documents:
                        file = await prepare_file(doc, tmpdir)
                        await bot.send_document(uid, document=file, caption=text or None)
                # 5. Только текст
                elif text:
                    await bot.send_message(uid, text=text)
                
            except Exception as e:
                print(f"[BOT] Ошибка отправки {uid}: {e}")

    return web.json_response({"status": "ok", "message": f"Рассылка {len(chat_ids)} юзерам выполнена"})


async def handle_get_plugin(request):
    plugin_name = request.match_info.get("plugin_name")
    try:
        plugin_module = import_module(f"bot.plugins.{plugin_name}")
        if hasattr(plugin_module, "get_data"):
            config = plugin_module.get_data()
            return web.json_response(config)
        else:
            return web.json_response({"status": "error", "message": "Плагин не имеет конфига"})
    except Exception as e:
        return web.json_response({"error": f"Плагин {plugin_name} не найден"}, status=404)
    
async def handle_set_plugin(request):
    plugin_name = request.match_info.get("plugin_name")
    data = await request.json()
    if not data:
        return web.json_response({"status": "error", "message": "Нет данных"})
    try:
        plugin_module = import_module(f"bot.plugins.{plugin_name}")
        if hasattr(plugin_module, "set_data"):
            config = plugin_module.set_data(data)
            return web.json_response(config)
        else:
            return web.json_response({"status": "error", "message": "Плагин не имеет конфига"})
    except Exception as e:
        return web.json_response({"error": f"Плагин {plugin_name} не найден"}, status=404)


def bot_init():
    res = requests.post(API_URL + "/init-bot")
    print(res.json())
    return res.json()



def setup_web_server():

    app = web.Application()
    app.router.add_post("/reload/{bot_name}", handle_reload)
    # app.router.add_post("/reload/{bot_name}", restart_bot)
    app.router.add_post("/broadcast", handler_broadcast)
    app.router.add_get("/plugins/config/{plugin_name}", handle_get_plugin)
    app.router.add_put("/plugins/config/{plugin_name}", handle_set_plugin)
    return app