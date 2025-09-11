from flask import Blueprint

api_bp = Blueprint('api', __name__, url_prefix='/api')

from . import plugins, commands, media, users
from app.core.database import db
from app.routes.bot import reload_bot
from flask import request, jsonify
from app.models.commands import Command
from app.models.Bot import Bot
from app.models.user import TelegramUser
from app.models.plugins import Plugin
from app.models.media import Media
from app.crud.upload import download_file
from app.crud.bot import start_bot
from flask_jwt_extended import jwt_required

@api_bp.route("/main-data/<botname>", methods=["GET"])
@jwt_required()
def get_main_data(botname: str):
    plugins = db.session.query(Plugin).all()
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    commands = db.session.query(Command).all()
    users = db.session.query(TelegramUser).all()

    total_count = {
        "users": len(users),
        "commands": len(commands),
        "plugins": len(plugins)
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
    return reload_bot(botname)


@api_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():
    file = request.files['file']
    content_type = file.content_type
    
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


@api_bp.route("/bot/config", methods=["POST"])
@jwt_required()
def set_bot_config():
    data = request.get_json()
    if not data['name']:
        return jsonify({"error": "Название бота не указано"}), 400
    bot = db.session.query(Bot).filter(Bot.name == data['name']).first()
    if not bot:
        bot = Bot(name=data['name'], token=data.get('token', ''), config=data['config'])
        db.session.add(bot)
    else:
        bot.token = data.get('token')
        bot.config = data['config']
        
        
    db.session.commit()
    return jsonify({"message": "Конфигурация бота успешно обновлена"}), 200



@api_bp.route("/startbot/<botname>", methods=["POST"])
@jwt_required()
def startBot(botname: str):
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 200
    
    Bot.query.update({Bot.is_active: False})
    db.session.commit()
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
    return jsonify({"status": "ok"}), 200