from app.models.plugins import Plugin
from app.core.database import db


def new_plugin(data: dict):
    new_plugin = Plugin(**data)
    db.session.add(new_plugin)
    print(new_plugin)
    db.session.commit()
    return "ok"