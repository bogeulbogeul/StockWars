from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1]
ref=Image.open(ROOT/'web/assets/items/packing-v1/popori-bread-v2.png').convert('RGBA');ref=ref.crop(ref.getbbox())
render=Image.open(OUT/'preview.png').crop((60,220,1440,1000))
canvas=Image.new('RGB',(1700,750),(250,247,239));d=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',28)
for im,x,title in [(ref,25,'원본 이미지 시안'),(render,875,'작은 둥근 끝을 살린 수정 모델')]:
    scale=min(800/im.width,600/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    canvas.paste(im,(x+(800-im.width)//2,115+(600-im.height)//2),im if im.mode=='RGBA' else None);d.text((x+400,50),title,font=font,fill=(90,65,40),anchor='mm')
canvas.save(OUT/'comparison.png')
