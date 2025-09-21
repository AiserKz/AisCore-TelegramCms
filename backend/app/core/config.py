from dotenv import load_dotenv
import os, datetime

load_dotenv()

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
BOT_CONTROL_URL = os.getenv('BOT_CONTROL_URL')

STATIC_FOLDER = "static"

BASE_URL = os.getenv('BASE_URL')
STATIC_URL = os.getenv('STATIC_URL')
DEBUG = os.getenv('DEBUG', "False").lower() in ('true', '1')
DOCKER = os.getenv('DOCKER', "False").lower() in ('true', '1')

BOT_COUNT = os.getenv('BOT_COUNT', 5)

JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(minutes=30)
JWT_REFRESH_TOKEN_EXPIRES = datetime.timedelta(days=30)

def init():
    for folder in [STATIC_FOLDER]:
        if not os.path.exists(folder):
            os.makedirs(folder)
    
            
            