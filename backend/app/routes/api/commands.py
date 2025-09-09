from . import api_bp
from flask import request, jsonify
from app.core.database import db
from app.models.commands import Command
from flask_jwt_extended import jwt_required

@api_bp.route("/commands", methods=["GET"])
@jwt_required()
def get_commands():
    commands = db.session.query(Command).all()
    return jsonify([c.to_dict() for c in commands])

@api_bp.route("/commands", methods=["POST"])
@jwt_required()
def create_command():
    data = request.get_json()
    cmd = Command(name=data['name'], response_text=data['response_text'], description=data['description'])
    db.session.add(cmd)
    db.session.commit()
    return jsonify(cmd.to_dict()), 201


@api_bp.route("/commands", methods=["DELETE"])
@jwt_required()
def delete_command():
    data = request.get_json()
    cmd = db.session.query(Command).filter_by(id=data['id']).first()
    if cmd:
        db.session.delete(cmd)
        db.session.commit()
        return jsonify({"message": "Команда успешно удалена"}), 200
    return jsonify({"error": "Команда не найдена"}), 404

@api_bp.route("/commands/<id>/toggle", methods=["PUT"])
@jwt_required()
def toggle_command(id):
    cmd = db.session.query(Command).filter_by(id=id).first()
    if cmd:
        cmd.enabled = not cmd.enabled
        db.session.commit()
        return jsonify({"message": "Статус команды успешно изменен"}), 200
    return jsonify({"error": "Команда не найдена"}), 404

@api_bp.route("/commands/<id>", methods=["PUT"])
@jwt_required()
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
