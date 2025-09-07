from flask import Blueprint, request, jsonify
from app.core.database import db
from app.models.user import User, TelegramUser
from app.models.media import Media
from app.models.plugins import Plugin
from app.models.commands import Command
from app.models.bot import Bot, BotPlugin
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.routes.bot import reload_bot, get_bot_options, set_bot_options
from app.crud.upload import download_file, delete_file


api_bp = Blueprint('api', __name__, url_prefix='/api')



@api_bp.route("/main-data/<botname>", methods=["GET"])
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
        "bot": bot.to_dict()
    })
    

@api_bp.route("/reload/<botname>", methods=["POST"])
def reload(botname: str):
    return reload_bot(botname)

@api_bp.route("/plugins", methods=["GET"])
def get_plugins():
    plugins = db.session.query(Plugin).all()
    return [plugin.to_dict() for plugin in plugins], 200

@api_bp.route("/plugins/<botname>/<int:id>/toggle", methods=["PUT"])
def toggle_plugin(botname: str, id: int):
    bot = Bot.query.filter_by(name=botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404

    plugin = Plugin.query.get(id)
    if not plugin:
        return jsonify({"error": "Плагин не найден"}), 404

    bp = BotPlugin.query.filter_by(bot_id=bot.id, plugin_id=plugin.id).first()

    if bp:
        # меняем статус
        bp.enabled = not bp.enabled
        db.session.commit()
        return jsonify({
            "status": "toggled",
            "plugin": plugin.name,
            "enabled": bp.enabled
        })
    else:
        # если нет связи — создаём
        bp = BotPlugin(bot_id=bot.id, plugin_id=plugin.id, enabled=True)
        db.session.add(bp)
        db.session.commit()
        return jsonify({
            "status": "enabled",
            "plugin": plugin.name,
            "enabled": True
        })

    
@api_bp.route("/plugins/<botname>/add", methods=["POST"])
def add_plugin(botname: str):
    data = request.get_json()
    bot = Bot.query.filter_by(name=botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404
    print(data)
    plugin = Plugin.query.filter_by(name=data['name']).first()
    if not plugin:
        return jsonify({"error": "Плагин не найден"}), 404

    bp = BotPlugin.query.filter_by(bot_id=bot.id, plugin_id=plugin.id).first()
    if bp:
        return jsonify({"error": "Плагин уже добавлен"}), 400

    bp = BotPlugin(bot_id=bot.id, plugin_id=plugin.id, enabled=True)
    db.session.add(bp)
    db.session.commit()
    return jsonify({
        "status": "enabled",
        "plugin": plugin.name,
        "enabled": True
    })

@api_bp.route("/plugins/<botname>/<plugin_id>/options", methods=["GET"])
def get_plugins_options(botname: str, plugin_id: int):
    plugin = db.session.query(Plugin).filter(Plugin.id == plugin_id).first()
    name = plugin.name
    if not name:
        return jsonify({"error": "Название плагина не указано"}), 400
    return get_bot_options(name)

@api_bp.route("/plugins/<botname>/<int:plugin_id>/options", methods=["PUT"])
def update_plugin_options(botname: str, plugin_id: int):
    plugin = db.session.query(Plugin).filter(Plugin.id == plugin_id).first()
    name = plugin.name
    if not name:
        return jsonify({"error": "Название плагина не указано"}), 400
    
    data = request.get_json()
    print(data)
    return set_bot_options(name, data)

@api_bp.route("/commands", methods=["GET"])
def get_commands():
    
    commands = db.session.query(Command).all()
    return jsonify([c.to_dict() for c in commands])

@api_bp.route("/commands", methods=["POST"])
def create_command():
    data = request.get_json()
    cmd = Command(name=data['name'], response_text=data['response_text'], description=data['description'])
    db.session.add(cmd)
    db.session.commit()
    return jsonify(cmd.to_dict()), 201


@api_bp.route("/commands", methods=["DELETE"])
def delete_command():
    data = request.get_json()
    cmd = db.session.query(Command).filter_by(id=data['id']).first()
    if cmd:
        db.session.delete(cmd)
        db.session.commit()
        return jsonify({"message": "Команда успешно удалена"}), 200
    return jsonify({"error": "Команда не найдена"}), 404

@api_bp.route("/commands/<id>/toggle", methods=["PUT"])
def toggle_command(id):
    cmd = db.session.query(Command).filter_by(id=id).first()
    if cmd:
        cmd.enabled = not cmd.enabled
        db.session.commit()
        return jsonify({"message": "Статус команды успешно изменен"}), 200
    return jsonify({"error": "Команда не найдена"}), 404

@api_bp.route("/commands/<id>", methods=["PUT"])
def update_command(id):
    data = request.get_json()
    cmd = db.session.query(Command).filter_by(id=id).first()
    if cmd:
        cmd.name = data['name']
        cmd.response_text = data['response_text']
        cmd.description = data['description']
        cmd.enabled = data['enabled']
        db.session.commit()
        return jsonify({"message": "Команда успешно обновлена"}), 200
    return jsonify({"error": "Команда не найдена"}), 404


@api_bp.route("/users", methods=["GET"])
def get_users():
    users = db.session.query(TelegramUser).all()
    return [user.to_dict() for user in users], 200


@api_bp.route("/upload", methods=["POST"])
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


@api_bp.route("/media", methods=["GET"])
def get_media():
    media = db.session.query(Media).all()
    return [m.to_dict() for m in media], 200

@api_bp.route("/media/<int:media_id>", methods=["DELETE"])
def delete_media(media_id):
    media = db.session.query(Media).get(media_id)
    if media:
        delete_file(media.file_path)
        db.session.delete(media)
        db.session.commit()
        return jsonify({"message": "Файл успешно удален"}), 200
    return jsonify({"error": "Файл не найден"}), 404
