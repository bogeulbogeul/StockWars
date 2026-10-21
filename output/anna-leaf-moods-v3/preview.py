from PIL import Image
from pathlib import Path
P=Path(__file__).resolve().parent
f=[Image.open(x).convert('RGB') for x in sorted(P.glob('sad-*.png'))];f[0].save(P/'sad.gif',save_all=True,append_images=f[1:],duration=[160,170,170]*4,loop=0)
