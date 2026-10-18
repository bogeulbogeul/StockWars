from PIL import Image, ImageDraw
from pathlib import Path
P=Path(__file__).resolve().parent
frames=[Image.open(p).convert('RGB') for p in sorted((P/'frames').glob('*.png'))]
assert len(frames)==24
durations=[40,40,40,40,40,50]*4
frames[0].save(P/'walk-preview.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0)
sheet=Image.new('RGB',(4*240,2*265),'#e5e5e5');d=ImageDraw.Draw(sheet)
for i,f in enumerate([1,4,7,10,13,16,19,22]):
    x=(i%4)*240;y=(i//4)*265
    sheet.paste(frames[f-1].resize((240,240)),(x,y));d.text((x+8,y+244),f'Frame {f}',fill='black')
sheet.save(P/'walk-contact-sheet.png')
print('Preview GIF and contact sheet saved')
