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
