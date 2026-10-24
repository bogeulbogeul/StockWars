from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',23)
views=[('frames','정면'),('side-frames','왼쪽 옆'),('opposite-side-frames','오른쪽 옆'),('rear-frames','뒤')]
frames=[]
for i in range(36):
 canvas=Image.new('RGB',(768,896),(44,44,44));d=ImageDraw.Draw(canvas)
 for j,(folder,title) in enumerate(views):
  x=(j%2)*384;y=(j//2)*448
  canvas.paste(Image.open(P/folder/f'{i:03}.png').convert('RGB').resize((384,416),Image.Resampling.LANCZOS),(x,y+32))
  d.text((x+12,y+2),title,font=font,fill=(245,245,245))
 frames.append(canvas)
frames[13].save(P/'bite-four-views.png')
palette=frames[13].quantize(colors=256);converted=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
converted[0].save(P/'eat-four-views.gif',save_all=True,append_images=converted[1:],duration=125,loop=0,optimize=False)
# Slow first-bite inspection: bring bread up, bite, then lower it.
clip=[converted[i] for i in range(9,18)]
clip[0].save(P/'first-bite-four-views.gif',save_all=True,append_images=clip[1:],duration=170,loop=0,optimize=False)
