"""Arrange the three actual model renders without altering character pixels."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent
sheet=Image.new('RGB',(2700,1110),'#f5f3ee')
draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',32)
small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
for i,(name,label) in enumerate([('front','정면'),('right','오른쪽 측면'),('back','후면')]):
    shot=Image.open(P/(name+'.png')).convert('RGB')
    assert shot.size==(900,1000)
    sheet.paste(shot,(i*900,70))
    draw.text((i*900+450,32),label,font=font,fill='#373a33',anchor='mm')
draw.text((1350,1089),'소망이 기본 체형 · 현재 게임 GLB · 같은 배율의 정투영 · 2026-10-25',font=small,fill='#55594e',anchor='mm')
sheet.save(P/'three-views.png')
