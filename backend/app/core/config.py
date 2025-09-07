from dotenv import load_dotenv
import os

load_dotenv()

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
BOT_CONTROL_URL = os.getenv('BOT_CONTROL_URL')

STATIC_FOLDER = "static"

BASE_URL = os.getenv('BASE_URL')

def init():
    for folder in [STATIC_FOLDER]:
        if not os.path.exists(folder):
            os.makedirs(folder)
            
            