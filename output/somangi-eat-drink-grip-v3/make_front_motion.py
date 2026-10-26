from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
for kind in ['bread','drink']:
    frames=[Image.open(P/f'{kind}-front-motion'/f'{i:03}.png').convert('RGB') for i in range(36)]
    palette=frames[16].quantize(colors=256);colors=palette.getpalette()
    darkest=min(range(256),key=lambda i:sum(colors[i*3:i*3+3]))
    colors[darkest*3:darkest*3+3]=[0,0,0];palette.putpalette(colors)
    encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
    encoded[0].save(P/f'{kind}-front-motion.gif',save_all=True,append_images=encoded[1:],
        duration=[100 if i%6==0 else 80 for i in range(36)],loop=0,optimize=False)
    sheet=Image.new('RGB',(1440,520))
    for col,i in enumerate([4,16,28]):sheet.paste(frames[i],(col*480,0))
    sheet.save(P/f'{kind}-front-motion-check.png')
    print(P/f'{kind}-front-motion.gif')
