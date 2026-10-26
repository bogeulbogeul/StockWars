from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent;font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',24);combined=[]
for i in range(36):
 canvas=Image.new('RGB',(960,552),(42,42,42));d=ImageDraw.Draw(canvas)
 for x,folder,label in [(0,'side-frames','왼쪽 옆'),(480,'opposite-side-frames','오른쪽 옆')]:
  canvas.paste(Image.open(P/folder/f'{i:03}.png').convert('RGB'),(x,32));d.text((x+12,1),label,font=font,fill='white')
 combined.append(canvas)
combined[13].save(P/'both-sides-peak.png');palette=combined[13].quantize(colors=256);colors=palette.getpalette();dark=min(range(256),key=lambda j:sum(colors[j*3:j*3+3]));colors[dark*3:dark*3+3]=[0,0,0];palette.putpalette(colors);frames=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in combined]
frames[0].save(P/'eat-both-sides.gif',save_all=True,append_images=frames[1:],duration=125,loop=0,optimize=False)
for folder,name in [('side-frames','eat-left.gif'),('opposite-side-frames','eat-right.gif')]:
 images=[Image.open(P/folder/f'{i:03}.png').convert('RGB') for i in range(36)];images[0].save(P/name,save_all=True,append_images=images[1:],duration=125,loop=0)
