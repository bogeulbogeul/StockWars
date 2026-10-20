from PIL import Image
from pathlib import Path
p=Path('C:/GitHub/StockWars/output/anna-motion-v1')
f=[Image.open(x).convert('RGB') for x in sorted(p.glob('frame-*.png'))]
f[0].save(p/'walk-preview.gif',save_all=True,append_images=f[1:],duration=[60,60,60,70]*3,loop=0)
