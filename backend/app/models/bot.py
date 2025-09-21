from datetime import datetime
from app.core.database import db

from app.models.user import user_bot
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from werkzeug.security import generate_password_hash, check_password_hash

if TYPE_CHECKING:
    from app.models.user import TelegramUser
    from app.models.plugins import Plugin
    from app.models.commands import Commands


class BotPlugin(db.Model):
    __tablename__ = "bot_plugins"

    bot_id = db.Column(db.Integer, db.ForeignKey("bot.id"), primary_key=True)
    plugin_id = db.Column(db.Integer, db.ForeignKey("plugin.id"), primary_key=True)

    enabled = db.Column(db.Boolean, default=True)
    config = db.Column(db.JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # связи
    bot = db.relationship("Bot", back_populates="bot_plugins")
    plugin = db.relationship("Plugin", back_populates="plugin_bots")
    
    def __init__(self, bot_id, plugin_id, enabled=True, config={}):
        self.bot_id = bot_id
        self.plugin_id = plugin_id
        self.enabled = enabled
        self.config = config

    def to_dict(self, with_plugin=False):
        data = {
            "bot_id": self.bot_id,
            "plugin_id": self.plugin_id,
            "enabled": self.enabled,
            "config": self.config,
        }
        if with_plugin and self.plugin:
            data["plugin"] = self.plugin.to_dict()
        return data


class Bot(db.Model):
    __tablename__ = "bot"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(db.String(80), unique=True, nullable=False)
    token: Mapped[str] = mapped_column(db.String, nullable=False)
    config: Mapped[dict] = mapped_column(db.JSON, default={})
    is_active: Mapped[bool] = mapped_column(db.Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    password: Mapped[str | None] = mapped_column(db.String(255), nullable=True)
    
    bot_plugins: Mapped[List["BotPlugin"]] = relationship(
        "BotPlugin",
        back_populates="bot",
        cascade="all, delete-orphan"
    )
    commands: Mapped[List["Commands"]] = relationship(
        "Commands",
        back_populates="bot",
        cascade="all, delete-orphan"
    )
    users: Mapped[List["TelegramUser"]] = relationship(
        "TelegramUser",
        secondary=user_bot,
        back_populates="bots"
    )
    
    def set_password(self, password):
        self.password = generate_password_hash(password)
        
    def check_password(self, password: str):
        if not self.password:
            return False
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "token": self.token[-10:],
            "config": self.config,
            "plugins": [bp.to_dict(with_plugin=True) for bp in self.bot_plugins], # type: ignore
            "commands": [c.to_dict() for c in self.commands], # type: ignore
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "password": self.password
        }
