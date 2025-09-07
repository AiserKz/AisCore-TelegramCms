from app.core.database import db
from datetime import datetime
from app.core.config import BASE_URL

class Media(db.Model):
    __tablename__ = "media"
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "file_name": self.file_name,
            "file_size": self.file_size,
            "file_path": f"{BASE_URL}/{self.file_path}",
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }