from pathlib import Path
from PIL import Image, ImageDraw
out=Path('C:/GitHub/StockWars/output/cipher-cozy-desk-painted-v2');out.mkdir(exist_ok=True)
image=Image.new('RGB',(1200,500),'#f3ead9');draw=ImageDraw.Draw(image)
def p(x,y):return (round(600+x*2100),round(390-y*2100))
for x,h in [(-.11,.035),(-.035,.062),(.04,.092)]:
    left,bottom=p(x-.0195,0);right,top=p(x+.0195,h)
    draw.rounded_rectangle((left,top,right,bottom),radius=5,fill='#315c80')
draw.line([p(x,y) for x,y in [(-.13,.048),(-.045,.087),(.025,.075),(.13,.123)]],fill='#315c80',width=18,joint='curve')
draw.line([p(x,y) for x,y in [(.088,.122),(.13,.123),(.113,.085)]],fill='#315c80',width=18,joint='curve')
image.save(out/'desk-logo.png')
