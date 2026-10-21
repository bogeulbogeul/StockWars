from PIL import Image
from pathlib import Path
p=Path('C:/GitHub/StockWars/output/anna-motion-v3')
for view in ['front','side']:
 frames=[Image.open(x).convert('RGB') for x in sorted(p.glob(view+'-*.png'))]
 frames[0].save(p/('walk-'+view+'.gif'),save_all=True,append_images=frames[1:],duration=[60,60,60,70]*3,loop=0)
