from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, jsonify

api_bp = Blueprint('api', __name__, url_prefix='/api')

from . import plugins, commands, media, users, bot
# Core
from app.core.database import db
# Services / CRUD
from app.crud.upload import download_file
from app.crud.bot import start_bot, stop_bot, send_broadcast, reload_bot
from app.crud.api import get_bot_data
# Models
from app.models.commands import Commands
from app.models.Bot import Bot
from app.models.plugins import Plugin
from app.models.media import Media



@api_bp.route("/main-data/<botname>", methods=["GET"])
@jwt_required()
def get_main_data(botname: str):
    plugins = db.session.query(Plugin).all()
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404
    commands = db.session.query(Commands).filter(Commands.bot_id == bot.id).all() # type: ignore
    users = bot.users 

    total_count = {
        "users": len(users), 
        "commands": len(commands),
        "plugins": len(bot.bot_plugins) 
    }

    return jsonify({
        "total_count": total_count,
        "plugins": [p.to_dict() for p in plugins],
        "commands": [c.to_dict() for c in commands],
        "users": [u.to_dict() for u in users],
        "bot": bot.to_dict() if bot and hasattr(bot, "to_dict") else None
    })
    

@api_bp.route("/reload/<botname>", methods=["POST"])
@jwt_required()
def reload(botname: str):
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if bot and bot.is_active:
        return reload_bot(botname)
    else:
        return jsonify({"error": "Бот не активен"}), 400


@api_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():
    file = request.files['file']
    content_type = file.content_type or ''
    
    if content_type.startswith('image/'):
        types = 'images'
    elif content_type.startswith('video/'):
        types = 'videos'
    elif content_type.startswith('application/'):
        types = 'documents'
    else:
        types = 'all'
        
    if not file:
        return jsonify({"error": "Файл не выбран"}), 400
    
    url, path, filesize = download_file(file, types)

    file_db = Media(
        file_name=file.filename,
        file_size=filesize, 
        file_path=path 
    ) 
    
    db.session.add(file_db)
    db.session.commit()

    return jsonify({"url": url, "type": types}), 200


@api_bp.route("/check_active", methods=["GET"])
@jwt_required()
def get_active_bot():
    bot_name = request.args.get('bot_name')
    bot = db.session.query(Bot).filter(Bot.name == bot_name).first()
    return jsonify({"is_active": bot.is_active if bot else False}), 200


@api_bp.route("/startbot/<botname>", methods=["POST"])
@jwt_required()
def startBot(botname: str):
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 200
    bot.is_active = True
    db.session.commit()
    return start_bot(botname)

@api_bp.route("/stopbot/<botname>", methods=["POST"])
@jwt_required()
def stopBot(botname: str):
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 200
    bot.is_active = False
    db.session.commit()
    stop_bot(botname)
    return jsonify({"status": "ok"}), 200


@api_bp.route("/broadcast/<botname>", methods=["POST"])
@jwt_required()
def broadcast(botname: str):
    data = request.get_json()
    return send_broadcast(data, botname)


@api_bp.route("/check_token", methods=["POST"])
@jwt_required()
def check_token():
    data = request.get_json()
    token = data.get('token')
    if not token:
        return jsonify({"status": "error", "message": "Токен не указан"}), 400
    url = f"https://api.telegram.org/bot{token}/getMe"
    
    return get_bot_data(url)
