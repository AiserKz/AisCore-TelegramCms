from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def init_DB():
   from app.models.user import User
   from app.models.Bot import Bot
   if db.session.query(User).first() is None:
      default_user = User(username="admin")
      default_user.set_password("admin")
      default_bot = Bot(name="default", token="None")
      db.session.add(default_bot)
      db.session.add(default_user)
      db.session.commit()
