from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
frames=[Image.open(P/'rear-frames'/f'{i:03}.png').convert('RGB') for i in range(36)]
palette=frames[13].quantize(colors=256)
encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
encoded[0].save(P/'eat-rear.gif',save_all=True,append_images=encoded[1:],
    duration=[100 if i%6==0 else 80 for i in range(36)],loop=0,optimize=False)
sheet=Image.new('RGB',(1440,520))
for j,i in enumerate([0,13,32]):sheet.paste(frames[i],(480*j,0))
sheet.save(P/'rear-inspection.png')
