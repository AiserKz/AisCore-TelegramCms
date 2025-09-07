from aiogram.types import Message
from aiogram import Bot
from . import user_log
import requests

def get_weather(city: str, api: str, units: str = "metric", lang: str = "ru"):
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&units={units}&lang={lang}&appid={api}"
    response = requests.get(url)

    if response.status_code == 200:
        resp = response.json()
        temp = resp['main']['temp']
        feels_like = resp['main']['feels_like']
        description = resp['weather'][0]['description']
        wind_speed = resp['wind']['speed']
        humidity = resp['main']['humidity']
        pressure = int(resp['main']['pressure'] * 0.75)  # перевод в мм рт. ст.
        clouds = resp['clouds']['all']

        return (
            f"📍 <b>Погода в {city}</b>: {temp}°C\n"
            f"🤔 Ощущается как: <b>{feels_like}°C</b>\n"
            f"🌤 {description.capitalize()}\n"
            f"💨 Скорость ветра: <b>{wind_speed} м/с</b>\n"
            f"💧 Влажность: <b>{humidity}%</b>\n"
            f"🔽 Давление: <b>{pressure} мм рт. ст.</b>\n"
            f"☁️ Облачность: <b>{clouds}%</b>"
        )

    # если ошибка
    try:
        return f"⚠️ Ошибка: {response.json().get('message', 'Неизвестная ошибка')}"
    except Exception:
        return f"⚠️ Ошибка: статус {response.status_code}"

