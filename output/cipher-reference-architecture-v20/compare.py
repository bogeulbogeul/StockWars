"""Put source and actual native render on the same pixel grid for review."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent
source=Image.open(ROOT/'reference.png').convert('RGB')
actual=Image.open(ROOT/'front-right.png').convert('RGB')
assert source.size==actual.size==(1374,1145)
crop=(20,280,1350,950)
contact=Image.new('RGB',(1330,365),'#eeeeee');draw=ImageDraw.Draw(contact)
for i,(img,label) in enumerate([(source,'REFERENCE'),(actual,'ACTUAL 3D MODEL')]):
 contact.paste(img.crop(crop).resize((665,335),Image.Resampling.LANCZOS),(i*665,30))
 draw.text((i*665+12,10),label,fill='#222222')
contact.save(ROOT/'comparison.png')
Image.blend(source,actual,.5).save(ROOT/'overlay.png')
