from PIL import Image
import numpy as np
from pathlib import Path
root=Path('C:/GitHub/StockWars/output')
target=Image.open('C:/Users/bogeu/AppData/Local/Temp/codex-clipboard-4cd1b240-a3ff-4abd-ad69-f95a50ca8eaa.png').convert('RGB')
def head(im):
    a=np.array(im);m=(a[:,:,0]>180)&(a[:,:,1]>180)&(a[:,:,2]>180)
    widths=m.sum(axis=1);peak=widths[:int(im.height*.55)].argmax()
    rows=np.where(widths[:peak+1]>2)[0];top=rows[0]
    xs=np.where(m[peak])[0]
    return ((xs[0]+xs[-1])/2,top,xs[-1]-xs[0])
tx,ty,tw=head(target);ta=np.array(target).astype(float)
scores=[]
for folder in root.glob('buddy-*'):
    files=list(folder.glob('side*.png'))+list((folder/'side').glob('*.png'))
    for file in files:
        try:
            im=Image.open(file).convert('RGB');x,y,w=head(im);scale=tw/w
            im=im.resize((round(im.width*scale),round(im.height*scale)))
            canvas=Image.new('RGB',target.size,(145,149,153));canvas.paste(im,(round(tx-x*scale),round(ty-y*scale)))
            score=np.mean((np.array(canvas).astype(float)-ta)**2)
            scores.append((score,str(file)))
        except Exception:pass
for item in sorted(scores)[:12]:print(item)
