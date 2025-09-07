import ast
import operator as op
from aiogram import types

operators = {
    ast.Add: op.add,
    ast.Sub: op.sub,
    ast.Mult: op.mul,
    ast.Div: op.truediv,
    ast.Pow: op.pow,
    ast.Mod: op.mod,
    ast.USub: op.neg
}

def safe_eval(expr: str):
    expr = expr.replace("^", "**")  # поддержка ^ как степени

    def _eval(node):
        if isinstance(node, ast.Constant):   # числа
            return node.n
        elif isinstance(node, ast.BinOp):   # бинарные операции
            return operators[type(node.op)](_eval(node.left), _eval(node.right))
        elif isinstance(node, ast.UnaryOp): # унарные операции (-5 и т.п.)
            return operators[type(node.op)](_eval(node.operand))
        else:
            raise TypeError(node)
        
    node = ast.parse(expr, mode='eval').body
    return _eval(node)

def calculate_expression(message: types.Message, cmd: dict) -> str:
    command = cmd.get("name", "").strip()

    # Отрезаем только выражение
    parts = message.text.split(maxsplit=1)
    expr = parts[1] if len(parts) > 1 else ""

    if not expr:
        return f"Введите выражение для вычисления, например: {command} (2+3)*2"

    try:
        result = safe_eval(expr)
        return (
            f"✅ Результат: <code><b>{result}</b></code>"
        )
    except Exception as e:
        return (
            f"⚠️ Ошибка: {str(e)}\n"
            f"Пример использования: {command} (2+3)*2"
        )
