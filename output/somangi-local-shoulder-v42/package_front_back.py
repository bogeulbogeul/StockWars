from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

P=Path(__file__).resolve().parent
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',24)
frames=[]
for i in range(36):
    canvas=Image.new('RGB',(960,552),(42,42,42))
    draw=ImageDraw.Draw(canvas)
    for x,folder,label in [(0,'frames','정면'),(480,'rear-frames','뒷모습')]:
        canvas.paste(Image.open(P/folder/f'{i:03}.png').convert('RGB'),(x,32))
        draw.text((x+12,1),label,font=font,fill='white')
    frames.append(canvas)
palette=frames[13].quantize(colors=256)
sequence=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
sequence[0].save(P/'eat-front-back.gif',save_all=True,append_images=sequence[1:],duration=125,loop=0,optimize=False)
for folder,name in [('frames','eat-front.gif'),('rear-frames','eat-back.gif')]:
    images=[Image.open(P/folder/f'{i:03}.png').convert('RGB') for i in range(36)]
    images[0].save(P/name,save_all=True,append_images=images[1:],duration=125,loop=0)
sheet=Image.new('RGB',(1920,520))
for row,folder in enumerate(['frames','rear-frames']):
    for col,i in enumerate([0,7,13,18,23,28,32,35]):
        picture=Image.open(P/folder/f'{i:03}.png').convert('RGB').resize((240,260))
        sheet.paste(picture,(col*240,row*260))
sheet.save(P/'front-back-contact-sheet.png')
frames[13].save(P/'front-back-peak.png')
