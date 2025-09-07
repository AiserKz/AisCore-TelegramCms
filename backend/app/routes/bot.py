from flask import Blueprint, request, jsonify
from app.core.database import db
from app.models.plugins import Plugin
from app.models.bot import Bot, BotPlugin
from app.models.commands import Command
import requests
from app.core.config import BOT_CONTROL_URL
from app.models.user import TelegramUser
import datetime


bot_bp = Blueprint('bot', __name__, url_prefix='/bot')

@bot_bp.route("/init-bot", methods=["POST"])
def init_bot():
    bot = db.session.query(Bot).first()
    bot_name = bot.name
    return jsonify({"bot_name": bot_name, "bot_token": bot.token, "config": bot.config}), 200
    

@bot_bp.route("/plugins/<botname>", methods=["GET"])
def get_plugins(botname: str):
    print(f"[API] Получаем плагины для бота {botname}")
    bot = db.session.query(Bot).filter(Bot.name == botname).first()

    plugins = BotPlugin.query.filter_by(bot_id=bot.id).all()
    pluginName = [{"name": p.plugin.name} for p in plugins if p.enabled]
    return jsonify(pluginName), 200


@bot_bp.route("/reload-bot/<botname>", methods=["POST"])
def reload_bot(botname):
    if not botname:
        return jsonify({"error": "Название бота не указано"}), 400
    try:
        resp = requests.post(BOT_CONTROL_URL + "/reload/" + botname)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@bot_bp.route("/commands/<botname>", methods=["GET"])
def get_commands(botname: str):
    print(f"[API] Получаем команды для бота {botname}")
    commands = Command.query.filter_by(enabled=True).all()
    return jsonify([{"name": c.name, "response": c.response_text} for c in commands]), 200


@bot_bp.route("/log_user", methods=["POST"])
def log_user():
    data = request.get_json()
    user_id = data.get("user_id")
    chat_id = data.get("chat_id")
    username = data.get("username")
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    language_code = data.get("language_code")
    is_bot = data.get("is_bot", False)

    user = TelegramUser.query.filter_by(user_id=user_id).first()
    if not user:
        # создаём нового пользователя
        user = TelegramUser(
            user_id=user_id,
            chat_id=chat_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
            language_code=language_code,
            is_bot=is_bot
        )
        db.session.add(user)
    else:
        # обновляем данные существующего пользователя
        user.chat_id = chat_id
        user.username = username
        user.first_name = first_name
        user.last_name = last_name
        user.language_code = language_code
        user.is_bot = is_bot
        user.last_seen = datetime.datetime.utcnow()
    db.session.commit()
    return jsonify({"status": "ok"})

@bot_bp.route("/broadcast", methods=["POST"])
def send_broadcast():
    data = request.get_json()
    text = data.get("message")
    chat_ids = data.get("to", [])
    images = data.get("images", [])
    videos = data.get("video", [])
    documents = data.get("docs", [])

    if not (text or images or videos or documents):
        return jsonify({
            "status": "error",
            "message": "Нужно указать текст сообщения или хотя бы один файл"
        }), 400

    # нормализуем пути у всех файлов
    images = [img.replace("\\", "/") for img in images]
    videos = [vid.replace("\\", "/") for vid in videos]
    documents = [doc.replace("\\", "/") for doc in documents]

    resp = requests.post(f"{BOT_CONTROL_URL}/broadcast", json={
        "text": text, 
        "chat_ids": chat_ids,
        "images": images,
        "videos": videos,
        "documents": documents
    })
    return jsonify(resp.json()), resp.status_code

def get_bot_options(name):
    resp = requests.get(f"{BOT_CONTROL_URL}/plugins/config/{name}")
    return resp.json()

def set_bot_options(name, data):
    try:
        resp = requests.put(f"{BOT_CONTROL_URL}/plugins/config/{name}", json=data)  # <-- json вместо data
        resp.raise_for_status()  # чтобы сразу поймать ошибки 4xx/5xx
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        # если сервер вернул не JSON, возвращаем текст ответа
        return resp.text


def new_plugin_bot(url):
    resp = requests.post(f"{BOT_CONTROL_URL}/plugins/download", json={"url": url})
    print(resp.json())
    # return resp.json()