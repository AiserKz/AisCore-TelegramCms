from aiogram import Bot


_bot: Bot | None = None

def set_bot(bot: Bot):
    global _bot
    _bot = bot
    
def get_bot():
    if _bot is None:
        raise RuntimeError("Bot is not set")
    return _bot