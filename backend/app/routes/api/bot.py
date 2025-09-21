from . import api_bp
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.core.database import db
from app.core.config import BOT_COUNT

from app.models.Bot import Bot
from app.models.user import User

@api_bp.route("/bot/config/<botname>", methods=["PUT"])
@jwt_required()
def set_bot_config(botname: str):
    data = request.get_json()
    if not data['name']:
        return jsonify({"error": "Название бота не указано"}), 400
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404
    else:
        bot.name = data['name']
        # bot.token = data.get('token')
        bot.config = data['config']
    db.session.commit()
    return jsonify({"message": "Конфигурация бота успешно обновлена"}), 200

@api_bp.route("/bot/<botname>", methods=["DELETE"])
@jwt_required()
def delete_bot(botname: str):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    
    if user.level < 3:
        return jsonify({"error": "Недостаточно прав"}), 403
    
    if bot:
        db.session.delete(bot)
        db.session.commit()
        return jsonify({"message": "Бот успешно удален"}), 200
    return jsonify({"error": "Бот не найден"}), 404



@api_bp.route("/bot/create", methods=["POST"])
@jwt_required()
def create_bot():
    data = request.get_json()
    if not data['name']:
        return jsonify({"error": "Название бота не указано"}), 400
    bot_name = data['name']
    password = data.get('password', '')
    
    if db.session.query(Bot).count() >= int(BOT_COUNT):
        return jsonify({"error": "Превышен лимит ботов"}), 400
    
    bot = Bot(name=bot_name, token=data.get('token', ''), config=data.get('config', {})) # type: ignore
    if password:
        bot.set_password(password)
    db.session.add(bot)
    db.session.commit()
    
    return jsonify(bot.to_dict()), 200


@api_bp.route("/bot/check", methods=["GET"])
@jwt_required()
def check_bot():
    bot_id = request.args.get("bot_id")
    password = request.args.get("password")

    if not bot_id:
        return jsonify({"error": "Недостаточно данных"}), 400

    bot = db.session.query(Bot).filter(Bot.id == bot_id).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404

    if bot.password:
        if not password:
            return jsonify({"error": "Пароль обязателен"}), 400
        if not bot.check_password(password):
            return jsonify({"error": "Неверный пароль"}), 400

    return jsonify(bot.to_dict()), 200

@api_bp.route("/bot/list", methods=["GET"])
@jwt_required()
def get_bot_list():
    bots = db.session.query(Bot).all()
    return jsonify([{
            "id": bot.id,
            "name": bot.name,
            "token": bot.token[-5:],
            "is_active": bot.is_active,
            "created_at": bot.created_at,
            "updated_at": bot.updated_at
        } for bot in bots[1:]]), 200
    