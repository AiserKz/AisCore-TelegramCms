from aiogram import types
import ast
import operator as op

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
    def _eval(node):
        if isinstance(node, ast.Constant):
            return node.n
        elif isinstance(node, ast.BinOp):
            return operators[type(node.op)](_eval(node.left), _eval(node.right))
        elif isinstance(node, ast.UnaryOp):
            return operators[type(node.op)](_eval(node.operand))
        else:
            raise TypeError(node)
        
    node = ast.parse(expr, mode='eval').body
    return _eval(node)

def calculate_expression(message: types.Message, cmd: dict) -> str:
    command = cmd.get("name", "").strip()
    
    expr = message.text.replace(command, "").strip()
    
    if not expr:
        return f"Введите выражение для вычисления, например: /{command} 2+2*2"

    try:
        result = safe_eval(expr)
        return f"Результат вычисления: {result}"
    except Exception as e:
        return f"Введите выражение для вычисления правильно, например: {command} 2+2*2 и т.д "