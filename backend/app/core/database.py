from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_DB():
    from app.models.plugins import Plugin

    if db.session.query(Plugin).count() == 0:
        db.session.add(Plugin(
            name="echo", enabled=False, 
            description="Echo бот который отправляет ваше сообщение", 
            version="1.0.0", author="Aiser", license="Ais", url="aisblack.ru"
        ))
        db.session.add(Plugin(
            name="Calculator", enabled=False, 
            description="Калькулятор", 
            version="1.0.0", author="Aiser", license="Ais", url="aisblack.ru"
        ))
        db.session.add(Plugin(
            name="Weather", enabled=False, 
            description="Погода", 
            version="1.0.0", author="Aiser", license="Ais", url="aisblack.ru"
        ))
        db.session.add(Plugin(
            name="WebApp", enabled=False, 
            description="Веб-приложение", 
            version="1.0.0", author="Aiser", license="Ais", url="aisblack.ru"
        ))
        
        db.session.commit()