from PIL import Image
from pathlib import Path
P=Path(__file__).resolve().parent
frames=[Image.open(p).convert('RGB') for p in sorted((P/'side-frames').glob('*.png'))]
assert len(frames)==24
frames[0].save(P/'walk-side-preview.gif',save_all=True,append_images=frames[1:],duration=[40,40,40,40,40,50]*4,loop=0)
