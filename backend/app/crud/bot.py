import requests

from app.core.config import BOT_CONTROL_URL


def reload_bot(name):
    try:
        resp = requests.post(f"{BOT_CONTROL_URL}/reload/{name}")
        resp.raise_for_status()  # чтобы сразу поймать ошибки 4xx/5xx
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        # если сервер вернул не JSON, возвращаем текст ответа
        return resp.text


def get_bot_options(name):
    resp = requests.get(f"{BOT_CONTROL_URL}/plugins/config/{name}")
    return resp.json()

def set_bot_options(name, data):
    try:
        resp = requests.put(f"{BOT_CONTROL_URL}/plugins/config/{name}", json=data)  # <-- json вместо data
        resp.raise_for_status()  # чтобы сразу поймать ошибки 4xx/5xx
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        # если сервер вернул не JSON, возвращаем текст ответа
        return resp.text


def new_plugin_bot(url):
    resp = requests.post(f"{BOT_CONTROL_URL}/plugins/download", json={"url": url})
    return resp.json()