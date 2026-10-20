from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

root = Path('C:/GitHub/StockWars')
out = root / 'output/cipher-cozy-mat-v3'
out.mkdir(exist_ok=True)
original = Image.open(root/'output/cipher-cozy-mat-v2/mat-texture.png').convert('RGB')
rgb = np.asarray(original).astype(float)
mask = Image.fromarray(np.uint8((rgb[:,:,0] > 160)*255))
soft = np.asarray(mask.filter(ImageFilter.GaussianBlur(2.0))).astype(float)/255
# White motifs sit 0.9 mm below the blue pile; soften the pressed edges.
height = -soft * .0009
dy, dx = np.gradient(height, .95/632, 1.8/1200)
normal = np.stack((-dx, dy, np.ones_like(dx)), axis=-1)
normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
Image.fromarray(np.uint8(np.clip(normal*.5+.5,0,1)*255)).save(out/'mat-inset-normal.png')
# A narrow inner shadow keeps the shallow impression readable at game scale.
inside = np.asarray(mask).astype(float)/255
inner_edge = inside*(1-soft)
shaded = rgb*(1-inner_edge[:,:,None]*.48)
Image.fromarray(np.uint8(np.clip(shaded,0,255))).save(out/'mat-texture.png')
