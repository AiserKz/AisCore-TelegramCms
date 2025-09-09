from . import api_bp
from flask import request, jsonify
from app.core.database import db
from app.models.user import TelegramUser
from flask_jwt_extended import jwt_required


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
def delete_user():
    data = request.get_json()
    user = db.session.query(TelegramUser).filter_by(id=data['id']).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Пользователь успешно удален"}), 200
    return jsonify({"error": "Пользователь не найден"}), 404
