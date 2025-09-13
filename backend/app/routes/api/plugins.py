from . import api_bp
from flask import request, jsonify
from app.core.database import db
from app.models.plugins import Plugin
from app.models.Bot import Bot
from flask_jwt_extended import jwt_required
from app.crud.bot import get_bot_options, set_bot_options
from app.crud.plugins import new_plugin
from app.crud.plugins import toggle_plugin, add_new_plagin, del_plagin, get_plugins

@api_bp.route("/plugins", methods=["GET"])
@jwt_required()
def plagins():
    
    return get_plugins()

@api_bp.route("/plugins/<plugin_name>", methods=["DELETE"])
@jwt_required()
def delete_plugin(plugin_name: str):
    return del_plagin(plugin_name)

@api_bp.route("/plugins/<botname>/<int:id>/toggle", methods=["PUT"])
@jwt_required()
def toggle(botname: str, id: int):
    return toggle_plugin(botname, id)

    
@api_bp.route("/plugins/<botname>/add", methods=["POST"])
@jwt_required()
def add_plugin(botname: str):
    data = request.get_json()
    return add_new_plagin(botname, data)

@api_bp.route("/plugins/<botname>/<int:plugin_id>/options", methods=["GET"])
@jwt_required()
def get_plugins_options(botname: str, plugin_id: int):
    plugin = db.session.query(Plugin).filter(Plugin.id == plugin_id).first()
    name = plugin.name
    if not name:
        return jsonify({"error": "Название плагина не указано"}), 400
    return get_bot_options(name)

@api_bp.route("/plugins/<botname>/<int:plugin_id>/options", methods=["PUT"])
@jwt_required()
def update_plugin_options(botname: str, plugin_id: int):
    plugin = db.session.query(Plugin).filter(Plugin.id == plugin_id).first()
    name = plugin.name
    if not name:
        return jsonify({"error": "Название плагина не указано"}), 400
    
    data = request.get_json()
    return set_bot_options(name, data)

@api_bp.route("/plugins/<botname>/<plugin_name>", methods=["DELETE"])
@jwt_required()
def uninstall_plugin_bot(botname: str, plugin_name: str):
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    for bp in bot.bot_plugins:
        if bp.plugin.name == plugin_name:
            db.session.delete(bp)
            db.session.commit()

    return jsonify({"message": "Плагин успешно удален"}), 200

@api_bp.route("/plugins/install", methods=["POST"])
@jwt_required()
def install_plugin():
    data = request.get_json()
    if not data['name'] or not data['url']:
        return jsonify({"error": "Название плагина не указано и/или URL"}), 400
    
    return new_plugin(data)


pluginData = [
    {
        "id": 5,
        "name": "Echo",
        "enabled": False,
        "description": "Простой плагин-эхо: повторяет сообщение пользователя.",
        "price": 0,
        "version": "1.0.0",
        "author": "Aiser",
        "license": "Ais",
        "url": "https://aisblack.ru/static/plugins/Echo.zip",
        "poster": "https://interesnyefakty.org/wp-content/uploads/chto-takoe-plagin.jpg"
    },
    {
        "id": 6,
        "name": "Welcome",
        "enabled": False,
        "description": "Отправляет приветственное сообщение новым пользователям.",
        "price": 199,
        "version": "1.2.0",
        "author": "Aiser",
        "license": "Ais",
        "url": "https://aisblack.ru/static/plugins/Welcome.zip",
        "poster": "https://content.timeweb.com/assets/65c70e62-4ae9-48bc-92ff-7886de5f50fa.jpg?width=3080&height=1600"
    },
    {
        "id": 11,
        "name": "Calculator",
        "enabled": False,
        "description": "Калькулятор.",
        "price": 0,
        "version": "1.0.2",
        "author": "Aiser",
        "license": "Ais",
        "url": "https://aisblack.ru/static/plugins/Calculator.zip",
        "poster": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4msaMIrvPeFegjYbfOVjSWO5jEmnQQKKqvQ&s"
    },
    {
        "id": 9,
        "name": "Weather",
        "enabled": False,
        "description": "Показывает погоду.",
        "price": 0,
        "version": "1.0.2",
        "author": "Aiser",
        "license": "Ais",
        "url": "https://aisblack.ru/static/plugins/Weather.zip",
        "poster": "https://img.freepik.com/premium-vector/weather-logo-gradient-vector-icon-illustration_269830-2064.jpg"
    },
    {
        "id": 10,
        "name": "WebAppButton",
        "enabled": False,
        "description": "Веб-приложение Кнопка рядом с полем ввода.",
        "price": 0,
        "version": "1.0.2",
        "author": "Aiser",
        "license": "Ais",
        "url": "https://aisblack.ru/static/plugins/WebAppButton.zip",
        "poster": "https://habrastorage.org/getpro/habr/upload_files/159/0bf/7f2/1590bf7f2c9295f7934da9b760d8696e.jpeg"
    },
    {
        "id": 7,
        "name": "Translate",
        "enabled": False,
        "description": "Переводит сообщение в другую локаль.",
        "price": 299,
        "version": "1.0.0",
        "author": "Aiser",
        "license": "Ais",
        "url": "https://aisblack.ru/static/plugins/Translate.zip",
        "poster": "https://translations.telegram.org/img/translations/lang_banner.png?1"
    }
]

@api_bp.route("/plugins/store", methods=["GET"])
def get_plugins_store():
    return jsonify(pluginData), 200
