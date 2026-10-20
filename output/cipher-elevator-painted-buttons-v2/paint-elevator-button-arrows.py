from pathlib import Path
from PIL import Image, ImageDraw
out=Path('C:/GitHub/StockWars/output/cipher-elevator-painted-buttons-v2');out.mkdir(exist_ok=True)
for label,direction in [('up',1),('down',-1)]:
    image=Image.new('RGB',(512,512),'#315c80');draw=ImageDraw.Draw(image)
    points=[(162,256+direction*48),(256,256-direction*65),(350,256+direction*48)]
    draw.line(points,fill='#f3ead9',width=32,joint='curve')
    for x,y in points:draw.ellipse((x-16,y-16,x+16,y+16),fill='#f3ead9')
    image.save(out/f'button-{label}.png')
