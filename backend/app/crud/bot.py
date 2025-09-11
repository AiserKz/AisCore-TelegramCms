import requests

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
        resp = requests.post(f"{BOT_CONTROL_URL}/start/{name}")
        return resp.json()
    except requests.exceptions.JSONDecodeError:
        return resp.text
    
