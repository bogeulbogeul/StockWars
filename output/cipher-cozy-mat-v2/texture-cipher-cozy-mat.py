from pathlib import Path
from PIL import Image,ImageDraw
out=Path('C:/GitHub/StockWars/output/cipher-cozy-mat-v2');out.mkdir(exist_ok=True)
image=Image.new('RGB',(1200,632),'#315c80');draw=ImageDraw.Draw(image)
cream='#f3ead9'
draw.rounded_rectangle((34,34,1166,598),radius=42,outline=cream,width=13)
def point(x,y):return (round(600+x*2100),round(436-y*2100))
for x,h in [(-.11,.035),(-.035,.062),(.04,.092)]:
    left,bottom=point(x-.0195,0);right,top=point(x+.0195,h)
    draw.rounded_rectangle((left,top,right,bottom),radius=7,fill=cream)
draw.line([point(x,y) for x,y in [(-.13,.048),(-.045,.087),(.025,.075),(.13,.123)]],fill=cream,width=18,joint='curve')
draw.line([point(x,y) for x,y in [(.088,.122),(.13,.123),(.113,.085)]],fill=cream,width=18,joint='curve')
image.save(out/'mat-texture.png')
