from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
for name,ms in [('walk',83),('wave',125)]:
    frames=[Image.open(p).convert('RGB') for p in sorted((P/(name+'_frames')).glob('*.png'))]
    frames[0].save(P/(name+'.gif'),save_all=True,append_images=frames[1:],duration=ms,loop=0)
