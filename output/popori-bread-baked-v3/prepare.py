from PIL import Image,ImageDraw
from pathlib import Path
import math
OUT=Path(__file__).resolve().parent
im=Image.new('RGB',(2560,256),(255,231,192));d=ImageDraw.Draw(im)
x,y,r=900,140,64
for i in range(5):
    a=math.tau*i/5-math.pi/2;cx=x+math.cos(a)*r*.54;cy=y+math.sin(a)*r*.54
    d.ellipse((cx-r*.43,cy-r*.43,cx+r*.43,cy+r*.43),fill=(233,159,65))
d.ellipse((x-15,y-15,x+15,y+15),fill=(255,231,192))
d.line([(1510,220),(1630,66)],fill=(154,121,76),width=13)
for x,y,a in [(1548,165,-35),(1610,139,50),(1580,112,-30),(1642,85,35)]:
    leaf=Image.new('RGBA',(95,55),(0,0,0,0));ImageDraw.Draw(leaf).ellipse((0,0,94,54),fill=(154,121,76));leaf=leaf.rotate(a,expand=True,resample=Image.Resampling.BICUBIC)
    im.paste(leaf,(x-leaf.width//2,y-leaf.height//2),leaf)
im.save(OUT/'paper-print.png')
# UV-baked surface maps: small toasted flecks and fine pores, no painted lighting.
import numpy as np
rng=np.random.default_rng(1025);W,H=2048,1024
from PIL import ImageFilter
def field(radius):
    a=rng.integers(0,256,(H,W),dtype=np.uint8)
    a=np.asarray(Image.fromarray(a).filter(ImageFilter.GaussianBlur(radius)),dtype=float)
    return (a-a.mean())/max(a.std(),1)
coarse=field(24);medium=field(4);fine=field(.55)
v=1-np.arange(H)[:,None]/(H-1);top=np.maximum(0,np.sin(v*math.tau))
bake=np.clip(.23+.045*coarse+.030*medium+.012*fine+.16*top,0,1)
light=np.array([255,184,65]);toast=np.array([206,105,25])
color=light[None,None,:]*(1-bake[:,:,None])+toast[None,None,:]*bake[:,:,None]
pores=rng.random((H,W))>.998;color[pores]*=.95
Image.fromarray(np.uint8(np.clip(color,0,255))).save(OUT/'crust-color.png')
height=field(.65)*.18+field(2.5)*.07
gy,gx=np.gradient(height);normal=np.stack((-gx*.38,gy*.38,np.ones_like(gx)),axis=-1);normal/=np.linalg.norm(normal,axis=-1)[:,:,None]
Image.fromarray(np.uint8(np.clip((normal*.5+.5)*255,0,255))).save(OUT/'crust-normal.png')
rough=np.clip(.35+.014*medium+.009*fine, .31,.42)
Image.fromarray(np.uint8(rough*255)).save(OUT/'crust-roughness.png')
