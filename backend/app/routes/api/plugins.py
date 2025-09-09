from . import api_bp
from flask import request, jsonify
from app.core.database import db
from app.models.plugins import Plugin
from app.models.bot import Bot
from flask_jwt_extended import jwt_required
from app.crud.bot import get_bot_options, set_bot_options
from app.crud.plugins import new_plugin
from app.crud.plugins import toogle_plugin, add_new_plagin, del_plagin, get_plugins

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
    return toogle_plugin(botname, id)

    
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
