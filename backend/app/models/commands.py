from app.core.database import db
from datetime import datetime

class Command(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    response_text = db.Column(db.String(255), nullable=False)
    enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.String(255), nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "response_text": self.response_text,
            "enabled": self.enabled,
            "created_at": self.created_at,
            "description": self.description,
        }