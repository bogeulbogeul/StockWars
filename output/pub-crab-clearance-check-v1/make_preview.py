from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent
frames=[Image.open(p).convert('RGB') for p in sorted((ROOT/'frames').glob('*.png'))]
assert len(frames)==24
frames[0].save(ROOT/'crab-passage.gif',save_all=True,append_images=frames[1:],
               duration=150,loop=0,optimize=False)
sheet=Image.new('RGB',(1440,1080))
for n,i in enumerate([3,7,11,15]):
    sheet.paste(frames[i],((n%2)*720,(n//2)*540))
sheet.save(ROOT/'contact-sheet.png')
print('PREVIEW_OK')
