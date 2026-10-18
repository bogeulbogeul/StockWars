"""Expand official baked color-strip lookup to original atlas, alpha exact."""
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).parent
colors=np.load(root/'source-colors.npy').astype(np.uint32)
targets=np.array(Image.open(root/'baked-strip/shared-rgb.png').convert('RGBA')).reshape(-1,4)[:len(colors),:3]
a=np.array(Image.open(root/'red-fox/run/sprite-sheet-alpha.png').convert('RGBA'))
pack=lambda c:(c[...,0].astype(np.uint32)<<16)|(c[...,1].astype(np.uint32)<<8)|c[...,2].astype(np.uint32)
keys=pack(colors);visible=a[:,:,3]>0
indices=np.searchsorted(keys,pack(a[:,:,:3][visible]))
assert np.array_equal(keys[indices],pack(a[:,:,:3][visible]))
a[visible,:3]=targets[indices]
(root/'baked').mkdir(exist_ok=True)
Image.fromarray(a).save(root/'baked/shared-rgb.png')
print('Expanded canonical RGB results; alpha preserved.')
