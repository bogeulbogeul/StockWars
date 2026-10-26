from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
OUT=Path(__file__).resolve().parent
root=OUT.parents[1]
source=Image.open(root/'web/assets/items/packing-v1/items.png').convert('RGBA').crop((20,40,410,390))
source.save(OUT/'reference.png')
render=Image.open(OUT/'preview.png').convert('RGB').crop((110,150,1090,1020))
canvas=Image.new('RGB',(1600,900),(250,247,239));draw=ImageDraw.Draw(canvas)
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',30)
small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
for im,x,title in [(source,35,'원본 상점 이미지'),(render,825,'수정한 실제 3D 모델')]:
    factor=min(740/im.width,710/im.height)
    im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS)
    if im.mode=='RGBA':canvas.paste(im,(x+(740-im.width)//2,125+(710-im.height)//2),im)
    else:canvas.paste(im,(x+(740-im.width)//2,125+(710-im.height)//2))
    draw.text((x+370,50),title,font=font,fill=(77,59,38),anchor='mm')
draw.line((800,30,800,845),fill=(220,208,186),width=2)
draw.text((800,865),'꿀 쿠키 4개입 · 연속된 꽃 모양 / 구운 테두리 / 꿀 장식 / 크림색 종이 포장',font=small,fill=(100,80,55),anchor='mm')
canvas.save(OUT/'comparison.png')
