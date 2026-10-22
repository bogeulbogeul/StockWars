from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
frames=[Image.open(P/'frames'/f'{i:03}.png').convert('RGB') for i in range(36)]
palette=frames[16].quantize(colors=256);colors=palette.getpalette()
dark=min(range(256),key=lambda i:sum(colors[i*3:i*3+3]));colors[dark*3:dark*3+3]=[0,0,0];palette.putpalette(colors)
encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
encoded[0].save(P/'eat-twohand-mouth.gif',save_all=True,append_images=encoded[1:],duration=[100 if i%6==0 else 80 for i in range(36)],loop=0,optimize=False)
sheet=Image.new('RGB',(1440,520))
for col,i in enumerate([0,16,32]):sheet.paste(frames[i],(col*480,0))
sheet.save(P/'contact-sheet.png')
