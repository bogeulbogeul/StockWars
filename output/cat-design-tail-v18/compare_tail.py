from pathlib import Path
from PIL import Image
import numpy as np
y,x=np.indices((512,512))
for name in ['cat-chest-brow-clean-v17','cat-design-tail-v18']:
    for i in range(3):
        a=np.array(Image.open(Path('output')/name/'frames/up_walk'/f'frame-{i}.png'))
        p=np.argwhere((a[:,:,3]>128)&(x>365)&(y>215)&(y<425))
        top=p[:,0].min()
        q=p[p[:,0]<top+9]
        print(name,i,q.mean(0).round(1))
