import tempfile, zipfile, requests, io, aiohttp, time, asyncio, os
from aiohttp import web
from aiogram.types import InputMediaPhoto, InputMediaVideo
from .plugin_loader import reload_bot_plugins
from .services.helpers import prepare_file
from importlib import import_module
from .services.config import API_URL, DOCKER

PLUGIN_DIR = '/bot/bot/plugins' if DOCKER else 'bot/plugins'



# ================== HTTP API для админки ==================

async def handle_reload(request):
    from .main import bots
    name = request.match_info.get("bot_name")
    if not name:
        return web.json_response({"status": "error", "message": "Название бота не указано"}, status=400)

    bot_entry = bots.get(name)
    if not bot_entry:
        return web.json_response({"status": "error", "message": f"Бот {name} не найден или не запущен"}, status=404)

    dp = bot_entry["dp"]

    print(f"[API] Перезагрузка плагинов и команд для бота {name}")
    await reload_bot_plugins(dp, name=name)

    return web.json_response({"status": "ok", "message": f"♻️ Плагины и команды для {name} перезагружены"})


async def handler_broadcast(request):
    from .main import bots
    bot_name = request.match_info.get("bot_name")
    
    bot = bots[bot_name]["bot"]
    
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
                            InputMediaVideo(media=file, caption=text if idx == 1 and text else None)
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
                print(videos, images, documents)
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


async def handle_dowload(request):
    data = await request.json()
    url = data.get("url")
    print(f"[API] Скачиваем плагин с {url}")
    if not url:
        return web.json_response({"status": "error", "message": "url не передан"}, status=400)
    
    if DOCKER:
        url = url.replace("localhost:5002", "backend:5002")
        url = url.replace("127.0.0.1:5002", "backend:5002")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url=url) as resp:
                if resp.status != 200:
                    return web.json_response({"status": "error", "message": f"Не удалось скачать архив: {resp.status}"}, status=500)
                content = await resp.read()
                
        with zipfile.ZipFile(io.BytesIO(content)) as zip_ref:
            top_dir = {name.split("/")[0] for name in zip_ref.namelist() if "/" in name}
            for d in top_dir:
                target_path = os.path.join(PLUGIN_DIR, d)
                if os.path.exists(target_path):
                    print(f"[API] Плагин {d} уже существует, установка отменена ❌")
                    return web.json_response({"status": "error", "message": f"Плагин '{d}' уже существует, установка отменена ❌"},
                status=400
            )
            zip_ref.extractall(PLUGIN_DIR)
        
        return web.json_response({"status": "ok", "message": "Плагин установлен и перезагружен ✅"})

    except zipfile.BadZipFile:
        return web.json_response({"status": "error", "message": "Файл не является ZIP-архивом"}, status=400)
    except Exception as e:
        return web.json_response({"status": "error", "message": str(e)}, status=500)

def bot_init(bot_name:str, retries=3, delay=3):
    for i in range(retries):
        try:
            res = requests.post(f'{API_URL}/init-bot/{bot_name}', timeout=5)
            res.raise_for_status()
            data = res.json()
            if not data or "bot_token" not in data:
                print(f"[BOT] Конфиг пустой, жду {delay} сек...")
            else:
                print(f"[BOT] Получены данные бота: {data['bot_name']}")
                return data
        except Exception as e:
            print(f"[BOT] Попытка {i+1}/3 не удалась: {e}")
            time.sleep(delay)
    return None

async def handle_start(request: web.Request):
    from .main import start_bot, bots
    bot_name = request.match_info.get("bot_name", "")
    data = bot_init(bot_name)
    if not data:
        return web.json_response({"status": "error", "message": "Нет данных"})
    
    if bot_name in bots:
        return web.json_response({"status": "error", "message": "Бот уже запущен"})

    await start_bot(bot_name, data["bot_token"], data["config"])
    return web.json_response({"status": "ok", "message": f"Бот {bot_name} запускается..."})

async def handle_stop(request: web.Request):
    from .main import stop_bot
    bot_name = request.match_info.get("bot_name", "")
    if await stop_bot(bot_name):
        return web.json_response({"status": "ok", "message": f"Бот {bot_name} остановлен"})
    return web.json_response({"status": "error", "message": "Бот не найден"})

def setup_web_server():
    app = web.Application()
    app.router.add_post("/start/{bot_name}", handle_start)
    app.router.add_post("/stop/{bot_name}", handle_stop)
    app.router.add_post("/reload/{bot_name}", handle_reload)
    app.router.add_post("/broadcast/{bot_name}", handler_broadcast)
    app.router.add_get("/plugins/config/{plugin_name}", handle_get_plugin)
    app.router.add_put("/plugins/config/{plugin_name}", handle_set_plugin)
    app.router.add_post("/plugins/download", handle_dowload)
    return app