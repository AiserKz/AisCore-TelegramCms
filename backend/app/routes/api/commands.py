from . import api_bp
from flask import request, jsonify
from app.core.database import db
from app.models.commands import Commands
from app.models.Bot import Bot
from flask_jwt_extended import jwt_required

@api_bp.route("/commands", methods=["GET"])
@jwt_required()
def get_commands():
    commands = db.session.query(Commands).all()
    return jsonify([c.to_dict() for c in commands])

@api_bp.route("/commands/<botname>", methods=["POST"])
@jwt_required()
def create_command(botname: str):
    data = request.get_json()
    
    if not botname:
        return jsonify({"error": "Название бота не указано"}), 400
    
    bot = db.session.query(Bot).filter(Bot.name == botname).first()
    if not bot:
        return jsonify({"error": "Бот не найден"}), 404
    

    if data["name"] in [c.name for c in bot.commands]:
        return jsonify({"error": "Команда с таким именем уже существует"}), 400
    
    cmd = Commands(
        name=data["name"],
        response_text=data["response_text"],
        description=data.get("description"),
        bot_id=bot.id,
    )
    db.session.add(cmd)
    db.session.commit()
    return jsonify(cmd.to_dict()), 201


@api_bp.route("/commands", methods=["DELETE"])
@jwt_required()
def delete_command():
    data = request.get_json()
    cmd = db.session.query(Commands).filter_by(id=data['id']).first()
    if cmd:
        db.session.delete(cmd)
        db.session.commit()
        return jsonify({"message": "Команда успешно удалена"}), 200
    return jsonify({"error": "Команда не найдена"}), 404


@api_bp.route("/commands/<int:id>/toggle", methods=["PUT"])
@jwt_required()
def toggle_command(id):
    cmd = db.session.query(Commands).filter_by(id=id).first()
    if cmd:
        try:
            cmd.enabled = not cmd.enabled
            db.session.commit()
            return jsonify({"message": "Статус команды успешно изменен"}), 200
        except Exception as e:
            db.session.rollback()
            print(f"Error toggling command status: {e}")
            return jsonify({"error": "Не удалось изменить статус на сервере"}), 500 
    return jsonify({"error": "Команда не найдена"}), 404

@api_bp.route("/commands/<id>", methods=["PUT"])
@jwt_required()
def update_command(id):
    data = request.get_json()
    name = data.get('name')

    existing = db.session.query(Commands).filter(
        Commands.name == name,
        Commands.id != id  
    ).first()

    if existing:
        return jsonify({"error": "Команда с таким именем уже существует"}), 400

    cmd = db.session.query(Commands).filter_by(id=id).first()
    if cmd:
        cmd.name = data['name']
        cmd.response_text = data['response_text']
        cmd.description = data['description']
        cmd.enabled = data['enabled']
        db.session.commit()
        return jsonify({"message": "Команда успешно обновлена"}), 200
    
    return jsonify({"error": "Команда не найдена"}), 404
