#!/usr/bin/env python3
"""Empacota uma cidade .sc2 para o modo história: js/maps/<id>.js (+ miniatura em img/maps/<id>.jpg).
uso: python3 tools/make_map.py <arquivo.sc2> <id> "<título>" "<autor>" <nível> [miniatura.png]"""
import sys, os, base64, json
from PIL import Image
src, mid, title, author, level = sys.argv[1:6]; thumb = sys.argv[6] if len(sys.argv) > 6 else None
root = os.path.join(os.path.dirname(__file__), '..'); os.makedirs(os.path.join(root, 'js', 'maps'), exist_ok=True); os.makedirs(os.path.join(root, 'img', 'maps'), exist_ok=True)
th = ''
if thumb:
    im = Image.open(thumb).convert('RGB'); im.thumbnail((640, 360)); th = f'img/maps/{mid}.jpg'; im.save(os.path.join(root, th), quality=85)
b64 = base64.b64encode(open(src, 'rb').read()).decode()
meta = {'title': title, 'author': author, 'level': int(level), 'thumb': th}
open(os.path.join(root, 'js', 'maps', f'{mid}.js'), 'w').write(f"// cidade do modo história: {title} — por {author}\n(window.SC2_MAPS = window.SC2_MAPS || {{}})[{json.dumps(mid)}] = Object.assign({json.dumps(meta)}, {{ b64: '{b64}' }});\n")
print('ok', mid, len(b64))
