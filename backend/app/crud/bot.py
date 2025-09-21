import requests
from flask import jsonify

from app.core.config import BOT_CONTROL_URL


def reload_bot(name):
    try:
        resp = requests.post(f"{BOT_CONTROL_URL}/reload/{name}")
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        return resp.text


def get_bot_options(name):
    try:
        resp = requests.get(f"{BOT_CONTROL_URL}/plugins/config/{name}")
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        return resp.text

def set_bot_options(name, data):
    try:
        resp = requests.put(f"{BOT_CONTROL_URL}/plugins/config/{name}", json=data) 
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        return resp.text


def new_plugin_bot(url):
    try:
        resp = requests.post(f"{BOT_CONTROL_URL}/plugins/download", json={"url": url})
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        return resp.text
    
def start_bot(name):
    try:
        print("Запускаю бота ", BOT_CONTROL_URL, name)
        resp = requests.post(f"{BOT_CONTROL_URL}/start/{name}")
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        return resp.text
    
def stop_bot(name):
    try:
        resp = requests.post(f"{BOT_CONTROL_URL}/stop/{name}")
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        return resp.text
    
    
def send_broadcast(data: dict, botname: str):
    text = data.get("message")
    chat_ids = data.get("to", [])
    images = data.get("images", [])
    videos = data.get("video", [])
    documents = data.get("docs", [])

    if not (text or images or videos or documents):
        return jsonify({
            "status": "error",
            "message": "Нужно указать текст сообщения или хотя бы один файл"
        }), 400

    # нормализуем пути у всех файлов
    images = [img.replace("\\", "/") for img in images]
    videos = [vid.replace("\\", "/") for vid in videos]
    documents = [doc.replace("\\", "/") for doc in documents]
    try:
        resp = requests.post(f"{BOT_CONTROL_URL}/broadcast/{botname}", json={
            "text": text, 
            "chat_ids": chat_ids,
            "images": images,
            "videos": videos,
            "documents": documents
        })
        return jsonify(resp.json()), resp.status_code
    except requests.exceptions.JSONDecodeError:
        print(resp.text)
        return resp.text