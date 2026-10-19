from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
frames=[Image.open(p).convert('RGB') for p in sorted((P/'side-frames').glob('*.png'))]
frames[0].save(P/'walk-side.gif',save_all=True,append_images=frames[1:],duration=83,loop=0)
