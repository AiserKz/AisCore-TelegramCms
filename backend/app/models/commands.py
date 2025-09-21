from app.core.database import db
from datetime import datetime

class Commands(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    response_text = db.Column(db.String(255), nullable=False)
    enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.String(255), nullable=True)
    
    bot_id = db.Column(db.Integer, db.ForeignKey("bot.id"), nullable=False)
    bot = db.relationship("Bot", back_populates="commands")
    
    def __init__(self, name: str, response_text: str, enabled: bool = True, description: str | None =None, bot_id: int | None = None):
        self.name = name
        self.response_text = response_text
        self.enabled = enabled
        self.description = description
        self.bot_id = bot_id
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "response_text": self.response_text,
            "enabled": self.enabled,
            "created_at": self.created_at,
            "description": self.description,
        }