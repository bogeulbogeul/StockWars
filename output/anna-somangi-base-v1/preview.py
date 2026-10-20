from PIL import Image
from pathlib import Path
p=Path('C:/GitHub/StockWars/output/anna-somangi-base-v1')
for view in ['front','side']:
 f=[Image.open(x).convert('RGB') for x in sorted(p.glob(view+'-*.png'))]
 f[0].save(p/('walk-'+view+'.gif'),save_all=True,append_images=f[1:],duration=[60,60,60,70]*3,loop=0)
