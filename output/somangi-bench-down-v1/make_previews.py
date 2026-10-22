from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
P=Path(__file__).resolve().parent
views={v:[Image.open(P/(v+'-frames')/f'{i:03}.png').convert('RGB') for i in range(46)] for v in ['front','side']}
combined=[]
for i in range(46):
    canvas=Image.new('RGB',(960,540))
    for x,v in enumerate(views):canvas.paste(views[v][i],(x*480,0))
    combined.append(canvas)
combined[0].save(P/'bench-down-preview.gif',save_all=True,append_images=combined[1:],duration=50,loop=0,optimize=False)
sheet=Image.new('RGB',(1440,600),'#ededed')
draw=ImageDraw.Draw(sheet)
for row,v in enumerate(views):
    for col,i in enumerate([0,7,15,22,27,40]):
        im=views[v][i].resize((240,270))
        x=col*240;y=row*300
        sheet.paste(im,(x,y+30))
        draw.text((x+8,y+8),f'{v} / {i*.05:.2f}s',fill='black')
sheet.save(P/'contact-sheet.png')
print(P/'bench-down-preview.gif')
