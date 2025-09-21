from app.models.plugins import Plugin
from app.models.Bot import BotPlugin, Bot
from flask import jsonify
from app.core.database import db
from app.crud.bot import new_plugin_bot
from sqlalchemy.sql import exists


def get_plugins():
    plugins = db.session.query(Plugin).all()
    return [plugin.to_dict() for plugin in plugins], 200

def new_plugin(data: dict):
    new_plugin = Plugin(**data)
    db.session.add(new_plugin)
    db.session.commit()
    return "ok"

def add_new_plagin(botname: str, data: dict):
    bot = Bot.query.filter_by(name=botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404

    plugin = Plugin.query.filter_by(name=data['name']).first()
    if not plugin:
        return jsonify({"error": "Плагин не найден"}), 404

    bp = BotPlugin.query.filter_by(bot_id=bot.id, plugin_id=plugin.id).first()
    if bp:
        return jsonify({"error": "Плагин уже добавлен"}), 400
    
    new_plugin_bot(plugin.download_link)
    bp = BotPlugin(bot_id=bot.id, plugin_id=plugin.id, enabled=False)
    db.session.add(bp)
    db.session.commit()
    return jsonify({
        "status": "enabled",
        "plugin": plugin.name,
        "enabled": False
    })

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


def del_plugin(plugin_name: str):
    plugin = db.session.query(Plugin).filter(Plugin.name == plugin_name).first()
    if not plugin:
        return jsonify({"error": "Плагин не найден"}), 404

    plugin_in_use = db.session.query(
        exists().where(BotPlugin.plugin_id == plugin.id) # type: ignore
    ).scalar()


    if plugin_in_use:
        return jsonify({
            "error": "Невозможно удалить плагин",
            "message": "Плагин используется хотя бы одним ботом"
        }), 400

    try:
        db.session.delete(plugin)
        db.session.commit()
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500