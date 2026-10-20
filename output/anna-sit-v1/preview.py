from PIL import Image
from pathlib import Path
P=Path(__file__).resolve().parent
f=[Image.open(x).convert('RGB') for x in sorted(P.glob('frame-*.png'))];f[0].save(P/'sit-preview.gif',save_all=True,append_images=f[1:],duration=[120,130]*12,loop=0)
