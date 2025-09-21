from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import select

db = SQLAlchemy()


def init_DB():
   init_default_data()
   
   
def init_default_data():
    from app.models.user import User
    from app.models.Bot import Bot

    # Проверяем пользователей
    if not db.session.execute(select(User).limit(1)).first():
        default_user = User(username="admin")
        default_user.set_password("admin")

        main_user = User(username="aiser", level=3)
        main_user.set_password("aiser")

        db.session.add_all([default_user, main_user])

    # Проверяем бота
    if not db.session.execute(select(Bot).filter_by(name="default")).first():
        default_bot = Bot(name="default", token="None")  # type: ignore
        db.session.add(default_bot)

    db.session.commit()