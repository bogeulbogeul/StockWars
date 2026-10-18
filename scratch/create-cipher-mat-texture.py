from pathlib import Path
from PIL import Image, ImageDraw

out = Path('C:/GitHub/StockWars/output/cipher-entry-mat-v1')
out.mkdir(exist_ok=True)
image = Image.new('RGB', (1024, 540), '#315c80')
draw = ImageDraw.Draw(image)
ivory = '#f3ead9'
draw.rounded_rectangle((24,24,1000,516), radius=28, outline=ivory, width=12)
# Same three bars and overlapping arrow used by the exterior emblem.
scale = 1800
def point(x,y):
    return (round(512+x*scale), round(370-y*scale))
for x,h in [(-.11,.035),(-.035,.062),(.04,.092)]:
    left, bottom = point(x-.0195,0)
    right, top = point(x+.0195,h)
    draw.rounded_rectangle((left,top,right,bottom), radius=7, fill=ivory)
line = [point(x,y) for x,y in [(-.13,.048),(-.045,.087),(.025,.075),(.13,.123)]]
draw.line(line, fill=ivory, width=15, joint='curve')
draw.line([point(x,y) for x,y in [(.088,.122),(.13,.123),(.113,.085)]], fill=ivory, width=15, joint='curve')
image.save(out / 'mat-texture.png')
