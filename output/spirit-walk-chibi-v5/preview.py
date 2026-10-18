from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
frames=[Image.open(p).convert('RGB') for p in sorted((P/'frames').glob('*.png'))]
frames[0].save(P/'walk.gif',save_all=True,append_images=frames[1:],duration=83,loop=0)
sheet=Image.new('RGB',(1200,600))
for n,i in enumerate([0,4,8,12]):sheet.paste(frames[i].resize((300,300)),((n%4)*300,0))
sheet.crop((0,0,1200,300)).save(P/'contact-sheet.png')
