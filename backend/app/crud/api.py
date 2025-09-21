import requests
from flask import jsonify



def get_bot_data(url: str):
    try:
        resp = requests.get(url, timeout=5)
        resp_data = resp.json()
        if resp_data.get("ok"):
            return jsonify({"status": "ok", "message": "Токен валиден", "bot": resp_data.get("result")}), 200
        else:
            return jsonify({"status": "error", "message": "Неверный токен"}), 401
    except requests.exceptions.RequestException as e:
        return jsonify({"status": "error", "message": f"Ошибка запроса: {e}"}), 500