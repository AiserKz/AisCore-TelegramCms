from . import api_bp
from flask import request, jsonify
from flask_jwt_extended import jwt_required

from app.core.database import db
from app.models.user import TelegramUser
from app.models.Bot import Bot


@api_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    users = db.session.query(TelegramUser).all()
    return [user.to_dict() for user in users], 200


@api_bp.route("/users", methods=["PUT"])
@jwt_required()
def update_user():
    data = request.get_json()
    user = db.session.query(TelegramUser).filter_by(id=data['id']).first()
    if user:
        user.first_name = data['first_name']
        user.last_name = data['last_name']
        user.username = data['username']
        user.language_code = data['language_code']
        user.subscribed = data['subscribed']
        db.session.commit()
        return jsonify({"message": "Пользователь успешно обновлен"}), 200
    return jsonify({"error": "Пользователь не найден"}), 404

@api_bp.route("/users", methods=["DELETE"])
@jwt_required()
def unlink_user_from_bot():
    data = request.get_json()
    user_id = data.get("user_id")
    bot_name = data.get("bot_name")

    if not user_id or not bot_name:
        return jsonify({"error": "user_id и bot_name обязательны"}), 400

    user = db.session.query(TelegramUser).filter_by(id=user_id).first()
    bot = db.session.query(Bot).filter_by(name=bot_name).first()

    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404

    if bot in user.bots:
        user.bots.remove(bot)
        db.session.commit()
        return jsonify({"message": "Привязка пользователя к боту удалена"}), 200
    else:
        return jsonify({"error": "Привязка не найдена"}), 404