"""Pack each source RGB once for an equivalent canonical recolor bake.

The official recolor command chooses the targets. Packing/unpacking avoids
scanning millions of transparent atlas pixels for every source color.
"""
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).parent
a=np.array(Image.open(root/'red-fox/run/sprite-sheet-alpha.png').convert('RGBA'))
colors=np.unique(a[a[:,:,3]>0,:3],axis=0)
np.save(root/'source-colors.npy',colors)
strip=np.zeros((int(np.ceil(len(colors)/512)),512,4),dtype=np.uint8)
flat=strip.reshape(-1,4);flat[:len(colors),:3]=colors;flat[:len(colors),3]=255
Image.fromarray(strip).save(root/'source-color-strip.png')
print('Packed unique source RGBs:',len(colors))
