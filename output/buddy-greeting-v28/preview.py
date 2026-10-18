from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
for name in ['front','angle']:
    frames=[Image.open(p).convert('RGB') for p in sorted((P/name).glob('*.png'))]
    frames[0].save(P/(name+'.gif'),save_all=True,append_images=frames[1:],duration=125,loop=0)
