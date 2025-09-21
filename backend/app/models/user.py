from werkzeug.security import generate_password_hash, check_password_hash
from app.core.database import db
from datetime import datetime
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy import BigInteger
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.Bot import Bot

user_bot = db.Table(
    "user_bot",
    db.Column("user_id", db.Integer, db.ForeignKey("telegram_user.id"), primary_key=True),
    db.Column("bot_id", db.Integer, db.ForeignKey("bot.id"), primary_key=True),
    db.Column("created_at", db.DateTime, default=datetime.utcnow)
)

class User(db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    level = db.Column(db.Integer, default=0)
    
    def __init__(self, username, password=None, level=0):
        self.username = username
        self.level = level
        if password:
            self.set_password(password)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "level": self.level
        }

class TelegramUser(db.Model):
    __tablename__ = "telegram_user"

    id: Mapped[int] = db.Column(db.Integer, primary_key=True)
    user_id: Mapped[int] = db.Column(BigInteger, nullable=False, unique=True)
    chat_id: Mapped[int] = db.Column(BigInteger, nullable=False)
    username: Mapped[str | None] = db.Column(db.String(80))
    first_name: Mapped[str | None] = db.Column(db.String(80))
    last_name: Mapped[str | None] = db.Column(db.String(80))
    language_code: Mapped[str | None] = db.Column(db.String(10))
    is_bot: Mapped[bool] = db.Column(db.Boolean, default=False)
    subscribed: Mapped[bool] = db.Column(db.Boolean, default=True)
    last_seen: Mapped[datetime] = db.Column(db.DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bots: Mapped[List["Bot"]] = relationship(
        "Bot",
        secondary=user_bot,
        back_populates="users"
    )
    
    def __init__(self, user_id, chat_id, username=None, first_name=None, last_name=None, language_code=None, is_bot=False, subscribed=True):
        self.user_id = user_id
        self.chat_id = chat_id
        self.username = username
        self.first_name = first_name
        self.last_name = last_name
        self.language_code = language_code        
        self.is_bot = is_bot
        self.subscribed = subscribed

    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "chat_id": self.chat_id,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "language_code": self.language_code,
            "is_bot": self.is_bot,
            "subscribed": self.subscribed,
            "last_seen": self.last_seen,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }