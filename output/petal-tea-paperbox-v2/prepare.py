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
 'side':(718,204,718,358,761,313,761,191),
}
for key,quad in panels.items():
    im=source.transform((768,768),Image.Transform.QUAD,quad,Image.Resampling.BICUBIC).convert('RGB')
    random.seed(1025);pix=im.load()
    for y in range(im.height):
        for x in range(im.width):
            noise=random.choice([-1,0,0,0,1]);pix[x,y]=tuple(max(0,min(255,c+noise)) for c in pix[x,y])
    im.save(OUT/f'print-{key}.png')
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
