from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
for folder,name in [('final-zoom-side','eat-side-detail'),('final-zoom-opposite','eat-opposite-detail')]:
    frames=[Image.open(P/folder/f'{i:03}.png').convert('RGB') for i in range(24)]
    palette=frames[9].quantize(colors=256)
    encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
    encoded[0].save(P/f'{name}.gif',save_all=True,append_images=encoded[1:],
        duration=[120 if i%2==0 else 130 for i in range(24)],loop=0,optimize=False)
    sheet=Image.new('RGB',(1280,1800),(76,76,76))
    for k,i in enumerate([0,5,9,12,17,23]):sheet.paste(frames[i],((k%2)*640,(k//2)*600))
    sheet.save(P/f'{name}-inspection.png')
