from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

P=Path(__file__).resolve().parent
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',24)
full=[];details=[]
for i in range(36):
    canvas=Image.new('RGB',(960,552),(42,42,42))
    close=Image.new('RGB',(960,352),(42,42,42))
    for x,folder,label in [(0,'side-frames','왼쪽 옆'),(480,'opposite-side-frames','오른쪽 옆')]:
        picture=Image.open(P/folder/f'{i:03}.png').convert('RGB')
        canvas.paste(picture,(x,32))
        close.paste(picture.crop((140,230,350,370)).resize((480,320)),(x,32))
        for target in [canvas,close]:ImageDraw.Draw(target).text((x+12,1),label,font=font,fill='white')
    full.append(canvas);details.append(close)
for frames,name in [(full,'eat-both-sides.gif'),(details,'side-junction-detail.gif')]:
    palette=frames[13].quantize(colors=256)
    sequence=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
    sequence[0].save(P/name,save_all=True,append_images=sequence[1:],duration=125,loop=0,optimize=False)
full[13].save(P/'both-sides-peak.png')
sheet=Image.new('RGB',(1920,520))
for row,folder in enumerate(['side-frames','opposite-side-frames']):
    for col,i in enumerate([0,7,13,18,23,28,32,35]):
        sheet.paste(Image.open(P/folder/f'{i:03}.png').convert('RGB').resize((240,260)),(col*240,row*260))
sheet.save(P/'side-contact-sheet.png')
