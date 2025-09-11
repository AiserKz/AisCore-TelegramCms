from datetime import datetime
from app.core.database import db


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

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    token = db.Column(db.String, nullable=False)
    config = db.Column(db.JSON, default={})
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # связь к BotPlugin
    bot_plugins = db.relationship("BotPlugin", back_populates="bot")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "token": self.token,
            "config": self.config,
            "plugins": [bp.to_dict(with_plugin=True) for bp in self.bot_plugins]
        }
