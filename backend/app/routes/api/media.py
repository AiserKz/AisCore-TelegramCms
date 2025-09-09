from . import api_bp
from flask import request, jsonify
from app.core.database import db
from app.models.media import Media
from app.crud.upload import delete_file
from flask_jwt_extended import jwt_required

@api_bp.route("/media", methods=["GET"])
@jwt_required()
def get_media():
    media = db.session.query(Media).all()
    return [m.to_dict() for m in media], 200

@api_bp.route("/media/<int:media_id>", methods=["DELETE"])
@jwt_required()
def delete_media(media_id):
    media = db.session.query(Media).get(media_id)
    if media:
        delete_file(media.file_path)
        db.session.delete(media)
        db.session.commit()
        return jsonify({"message": "Файл успешно удален"}), 200
    return jsonify({"error": "Файл не найден"}), 404
