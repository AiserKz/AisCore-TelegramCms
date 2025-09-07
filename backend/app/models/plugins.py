from app.core.database import db
from flask_sqlalchemy import SQLAlchemy

class Plugin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    enabled = db.Column(db.Boolean, nullable=False, default=False)
    description = db.Column(db.String(255), nullable=True)
    version = db.Column(db.String(20), nullable=True)
    author = db.Column(db.String(80), nullable=True)
    license = db.Column(db.String(20), nullable=True)
    url = db.Column(db.String(255), nullable=True)
    
    plugin_bots = db.relationship("BotPlugin", back_populates="plugin")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "enabled": self.enabled,
            "description": self.description,
            "version": self.version,
            "author": self.author,
            "license": self.license,
            "url": self.url,
        }