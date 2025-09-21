#!/bin/sh
flask db upgrade
exec python main.py 