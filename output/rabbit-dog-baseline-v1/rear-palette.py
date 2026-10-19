"""Rear has no pink inner ears/eyes: restrict its mapping to fur materials."""
import json
from pathlib import Path
from PIL import Image

root=Path(__file__).parent
pal=json.loads((root/'palette.json').read_text(encoding='utf-8'))['rgb']
fur=[c for c in pal if c[0]-c[1]<=40]
fmt=lambda c:'#'+''.join(f'{v:02x}' for v in c)
spec={'version':1,'kind':'sprite-gen-recolor','match':'tolerance','tolerance':255,
      'variants':[{'name':'rear-fur','map':{fmt(c):fmt(c) for c in fur}}]}
(root/'rear-recolor-spec.json').write_text(json.dumps(spec,indent=2),encoding='utf-8')
atlas=Image.open(root/'before-recolor.png').convert('RGBA')
atlas.crop((0,2000,960,2400)).save(root/'rear-before-palette.png')
print(f'Rear material palette: {len(fur)} of {len(pal)} existing colours.')
