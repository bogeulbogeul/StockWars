from pathlib import Path
from PIL import Image

root=Path(__file__).parent
p=root/'baked-final/shared-rgb.png'
atlas=Image.open(p).convert('RGBA')
row=Image.open(root/'baked-rear/rear-fur.png').convert('RGBA')
atlas.paste(row,(0,2000))
atlas.paste(row.crop((320,0,640,400)),(0,1600))
atlas.save(p)
