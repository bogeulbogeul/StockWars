from pathlib import Path
from PIL import Image,ImageDraw
import math
out=Path('C:/GitHub/StockWars/output/cipher-training-computers-v1');out.mkdir(exist_ok=True)
def canvas():
    im=Image.new('RGB',(1024,600),'#112d40');d=ImageDraw.Draw(im)
    d.rounded_rectangle((18,16,1006,44),radius=7,fill='#203f54')
    for x in [36,56,76]:d.ellipse((x,25,x+7,32),fill='#6a94ad')
    return im,d
im,d=canvas()
for y in range(85,510,85):d.line((38,y,988,y),fill='#294758',width=2)
for x in range(40,1000,120):d.line((x,60,x,515),fill='#294758',width=2)
values=[345-5*i-33*math.sin(i*.45) for i in range(42)]
for i,y in enumerate(values):
    x=45+i*22;close=y+22*math.sin(i*1.7);color='#54b8cd' if close<y else '#e87d74'
    d.line((x,y-19,x,close+19),fill=color,width=3)
    d.rectangle((x-6,min(y,close),x+6,max(y,close)+4),fill=color)
    d.rectangle((x-6,565-15-(i*19)%50,x+6,565),fill='#376a89')
d.line([(45+i*22,y+35) for i,y in enumerate(values)],fill='#e5c27c',width=3)
im.save(out/'monitor-chart.png')
im,d=canvas()
for row in range(3):
    top=65+row*160
    d.rounded_rectangle((25,top,610,top+145),radius=6,fill='#16364b')
    for y in [top+35,top+75,top+115]:d.line((38,y,596,y),fill='#2b4b5e',width=2)
    points=[(40+i*15,top+95-i*.8-19*math.sin(i*.6+row)) for i in range(37)]
    d.line(points,fill='#73b9d9',width=3)
for i in range(17):
    y=65+i*28
    d.rectangle((650,y,670+(i*31)%125,y+13),fill='#62bbaa')
    d.rectangle((828,y,848+(i*47)%130,y+13),fill='#dc847d')
    d.line((792,y+4,812,y+4),fill='#99adbb',width=3)
im.save(out/'monitor-analysis.png')
