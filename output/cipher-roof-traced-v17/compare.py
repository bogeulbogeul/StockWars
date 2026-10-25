from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parent
a=Image.open(root/'reference.png').convert('RGB');b=Image.open(root/'after.png').convert('RGB')
assert a.size==b.size,(a.size,b.size)
w,h=a.size
out=Image.new('RGB',(w,2*h+52),'#f5f2eb');draw=ImageDraw.Draw(out)
draw.text((10,7),'REFERENCE',fill='#252525');out.paste(a,(0,26))
draw.text((10,h+33),'ACTUAL 3D MODEL',fill='#252525');out.paste(b,(0,h+52))
out.save(root/'comparison.png')
Image.blend(a,b,.5).save(root/'overlay.png')
