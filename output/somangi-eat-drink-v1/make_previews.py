from pathlib import Path
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent
for kind in ['bread','drink']:
    frames=[]
    for i in range(36):
        panel=Image.new('RGB',(960,560),'#eeeeee');draw=ImageDraw.Draw(panel)
        for col,view in enumerate(['front','angle']):
            im=Image.open(P/f'{kind}-{view}'/f'{i:03}.png').convert('RGB')
            panel.paste(im,(col*480,40));draw.text((col*480+12,12),kind+' / '+view,fill='black')
        frames.append(panel)
    palette=frames[16].quantize(colors=256);colors=palette.getpalette()
    dark=min(range(256),key=lambda i:sum(colors[i*3:i*3+3]));colors[dark*3:dark*3+3]=[0,0,0];palette.putpalette(colors)
    encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
    encoded[0].save(P/f'{kind}-preview.gif',save_all=True,append_images=encoded[1:],duration=[100 if i%6==0 else 80 for i in range(36)],loop=0,optimize=False)
    sheet=Image.new('RGB',(960,1680))
    for row,i in enumerate([0,16,30]):sheet.paste(frames[i],(0,row*560))
    sheet.save(P/f'{kind}-contact-sheet.png')
    print(P/f'{kind}-preview.gif')
