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
    download_link = db.Column(db.String(255), nullable=True)
    poster = db.Column(db.String(255), nullable=True, default=None)
    price = db.Column(db.Float, nullable=True, default=None)
    status = db.Column(db.Integer, nullable=False, default=0)
    
    plugin_bots = db.relationship("BotPlugin", back_populates="plugin", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "enabled": self.enabled,
            "description": self.description,
            "version": self.version,
            "author": self.author,
            "license": self.license,
            "download_link": self.download_link,
            "poster": self.poster,
            "price": self.price
        }