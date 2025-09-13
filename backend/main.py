from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager
)
from app.core.database import db, init_DB
from app.core.config import JWT_SECRET_KEY, init, DEBUG, JWT_ACCESS_TOKEN_EXPIRES, JWT_REFRESH_TOKEN_EXPIRES, DOCKER
from app.routes import api, bot, auth
from app.models.user import User, TelegramUser
from app.models.Bot import Bot, BotPlugin
from app.models.commands import Command
from app.models.plugins import Plugin
from app.models.media import Media


app = Flask(__name__)
CORS(app)


if DOCKER:
    print("docker")
    # В Docker работаем с Postgres
    app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql+psycopg2://admin:admin@db:5432/bot_db"
else:
    print("local")
    # В локальной среде
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///db2.sqlite3"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = JWT_ACCESS_TOKEN_EXPIRES
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = JWT_REFRESH_TOKEN_EXPIRES

db.init_app(app)
jwt = JWTManager(app)

app.register_blueprint(auth.auth_bp)
app.register_blueprint(bot.bot_bp)
app.register_blueprint(api.api_bp)

@app.route('/')
def hello():
    return jsonify({'message': 'Бэк работает!'}), 200

if __name__ == '__main__':
    init()
    with app.app_context():
        db.create_all()
        init_DB()
    # app.run(debug=DEBUG, port=5002)
    app.run(host='0.0.0.0', port=5002, debug=DEBUG)