from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
frames=[Image.open(p).convert('RGB') for p in sorted((P/'front').glob('*.png'))]
frames[0].save(P/'front.gif',save_all=True,append_images=frames[1:],duration=125,loop=0)
