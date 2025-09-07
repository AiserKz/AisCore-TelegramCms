import os
from app.core.config import STATIC_FOLDER
from app.utils.file import secure_filename


def download_file(file, types: str = "all"):
    dir_name = f"{STATIC_FOLDER}/uploads/{types}"
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)
        
    path = secure_filename(file.filename, dir_name)
    path = os.path.join(dir_name, path)
        
    file.save(path)
    filesize = os.path.getsize(path) // 1024
    url = f"http://localhost:5000/static/uploads/{types}/{file.filename}"
    return url, path.replace("\\", "/"), filesize


def delete_file(path: str):
    if os.path.exists(path):
        os.remove(path)