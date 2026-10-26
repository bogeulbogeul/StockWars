from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1]
im=Image.open(ROOT/'web/assets/items/packing-v1/items.png').convert('RGBA')
im.crop((920,35,1075,390)).save(OUT/'reference.png')
# Only the printed cream label is used as a texture; the bottle is real geometry.
label=im.crop((946,193,1041,336)).convert('RGBA').resize((570,858),Image.Resampling.LANCZOS)
mask=Image.new('L',label.size,0);ImageDraw.Draw(mask).rounded_rectangle((0,0,569,857),radius=85,fill=255);label.putalpha(mask);label.save(OUT/'apple-label.png')
if (OUT/'preview.png').exists():
    canvas=Image.new('RGB',(1400,1050),(250,247,239));d=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',28)
    for name,x,title in [('reference.png',30,'원본 사과주스'),('preview.png',730,'수정한 실제 3D 모델')]:
        p=Image.open(OUT/name);s=min(640/p.width,890/p.height);p=p.resize((round(p.width*s),round(p.height*s)),Image.Resampling.LANCZOS)
        canvas.paste(p,(x+(640-p.width)//2,110+(890-p.height)//2),p if p.mode=='RGBA' else None);d.text((x+320,50),title,font=font,fill=(85,65,35),anchor='mm')
    canvas.save(OUT/'comparison.png')
