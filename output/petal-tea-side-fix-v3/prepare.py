"""Rectify approved illustration panels into print textures for a real 3D carton."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import random
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1]
source=Image.open(ROOT/'web/assets/items/packing-v1/items.png').convert('RGBA')
source.crop((440,40,790,390)).save(OUT/'reference.png')
panels={
 'front':(472,194,472,354,708,368,708,201),
 'roof':(510,121,476,190,708,199,730,125),
 'flap':(512,69,512,117,727,121,724,70),
}
for key,quad in panels.items():
    im=source.transform((768,768),Image.Transform.QUAD,quad,Image.Resampling.BICUBIC).convert('RGB')
    random.seed(1025);pix=im.load()
    for y in range(im.height):
        for x in range(im.width):
            noise=random.choice([-1,0,0,0,1]);pix[x,y]=tuple(max(0,min(255,c+noise)) for c in pix[x,y])
    im.save(OUT/f'print-{key}.png')
# Original side was a tiny oblique illustration crop; enlarging it stretched flowers.
# Rebuild the flat printed repeat at the true side-panel aspect ratio.
import math
im=Image.new('RGB',(768,870),(247,217,183));draw=ImageDraw.Draw(im)
draw.rectangle((0,0,768,46),fill=(242,151,159));draw.rectangle((0,828,768,870),fill=(242,151,159))
for x,y,r in [(145,145,47),(510,238,59),(260,445,65),(600,610,49),(130,725,42)]:
    for k in range(5):
        a=math.tau*k/5-math.pi/2;cx=x+math.cos(a)*r*.54;cy=y+math.sin(a)*r*.54
        draw.ellipse((cx-r*.39,cy-r*.39,cx+r*.39,cy+r*.39),fill=(231,133,144))
    draw.ellipse((x-r*.19,y-r*.19,x+r*.19,y+r*.19),fill=(255,232,195))
for x,y in [(540,450),(270,180),(370,690)]:
    draw.ellipse((x-14,y-35,x+14,y+35),fill=(158,172,101))
random.seed(1025);pix=im.load()
for y in range(im.height):
    for x in range(im.width):
        noise=random.choice([-1,0,0,0,1]);pix[x,y]=tuple(max(0,min(255,c+noise)) for c in pix[x,y])
im.save(OUT/'print-side.png')
def compare():
    render=Image.open(OUT/'preview.png').convert('RGB');ref=Image.open(OUT/'reference.png').convert('RGBA')
    canvas=Image.new('RGB',(1500,940),(249,245,237));draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',28)
    for im,x,title in [(ref,25,'원본 꽃잎 차 이미지'),(render,775,'수정한 실제 종이상자 모델')]:
        scale=min(700/im.width,780/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
        pos=(x+(700-im.width)//2,115+(780-im.height)//2)
        canvas.paste(im,pos,im if im.mode=='RGBA' else None);draw.text((x+350,52),title,font=font,fill=(80,59,49),anchor='mm')
    canvas.save(OUT/'comparison.png')
if (OUT/'preview.png').exists():compare()
