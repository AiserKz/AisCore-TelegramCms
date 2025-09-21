from flask import Blueprint, request, jsonify
from datetime import datetime

from app.core.database import db
from app.crud.bot import reload_bot

from app.models.Bot import Bot, BotPlugin
from app.models.user import TelegramUser


bot_bp = Blueprint('bot', __name__, url_prefix='/bot')

@bot_bp.route("/init-bot/<botname>", methods=["POST"])
def init_bot(botname: str):
    try:
        bot = db.session.query(Bot).filter_by(name=botname).first()
        if not bot:
            return jsonify({"error": "Активный бот не найден"}), 403

        return jsonify({
            "bot_name": bot.name,
            "bot_token": bot.token,
            "config": bot.config
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@bot_bp.route("/plugins/<botname>", methods=["GET"])
def get_plugins(botname: str):
    print(f"[API] Получаем плагины для бота {botname}")
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404

    plugins = BotPlugin.query.filter_by(bot_id=bot.id).all()
    pluginName = [{"name": p.plugin.name} for p in plugins if p.enabled]
    return jsonify(pluginName), 200


@bot_bp.route("/reload-bot/<botname>", methods=["POST"])
def reload(botname):
    if not botname:
        return jsonify({"error": "Название бота не указано"}), 400
    return reload_bot(botname)

@bot_bp.route("/commands/<botname>", methods=["GET"])
def get_commands(botname: str):
    print(f"[API] Получаем команды для бота {botname}")
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404
    commands = bot.commands
    if not commands:
        return jsonify([]), 200
    commands = [c for c in commands if c.enabled]
    return jsonify([{"name": c.name, "response": c.response_text} for c in commands]), 200 # type: ignore


@bot_bp.route("/log_user", methods=["POST"])
def log_user():
    data = request.get_json()
    user_id = data.get("user_id")
    chat_id = data.get("chat_id")
    username = data.get("username", "None")
    first_name = data.get("first_name", "None")
    last_name = data.get("last_name", "None")
    language_code = data.get("language_code", "None")
    is_bot = data.get("is_bot", False)
    bot_name = data.get("bot_name")

    if not user_id or not chat_id:
        return jsonify({"error": "user_id и chat_id обязательны"}), 400

    bot = Bot.query.filter_by(name=bot_name).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404

    user = TelegramUser.query.filter_by(user_id=user_id).first()
    if not user:
        user = TelegramUser(
            user_id=user_id,
            chat_id=chat_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
            language_code=language_code,
            is_bot=is_bot,
        )
        db.session.add(user)
    else:
        user.chat_id = chat_id
        if username:
            user.username = username
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.is_bot = is_bot
        user.last_seen = datetime.utcnow()

    if bot not in user.bots:
        user.bots.append(bot)

    db.session.commit()
    return jsonify({"status": "ok"})


@bot_bp.route("/stop/<botname>", methods=["POST"])
def stop_bot(botname: str):
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404
    bot.is_active = False
    db.session.commit()
    return jsonify({"status": "ok"}), 200