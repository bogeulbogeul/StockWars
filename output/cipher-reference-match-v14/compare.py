"""Diagnostic comparison; no retouching of the reference or model render."""
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parent
reference=Image.open(root/'approved-reference.png').convert('RGB')
render=Image.open(root/'matched.png').convert('RGB')
if reference.width==render.width+1 and reference.height==render.height:
    reference=reference.crop((0,0,render.width,render.height))
assert reference.size==render.size
Image.blend(reference,render,.5).save(root/'overlay.png')
w,h=reference.size
comparison=Image.new('RGB',(w*2,h+34),'#f4f1e9')
comparison.paste(reference,(0,34));comparison.paste(render,(w,34))
draw=ImageDraw.Draw(comparison)
draw.text((14,10),'REFERENCE',fill='#222222')
draw.text((w+14,10),'ACTUAL 3D MODEL / SAME FITTED VIEW',fill='#222222')
comparison.save(root/'comparison.png')
print('Saved unretouched comparison.png and 50% overlay.png')
