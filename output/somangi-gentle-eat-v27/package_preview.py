from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
for folder,name in [('frames','eat-front.gif'),('side-frames','eat-side.gif')]:
    frames=[Image.open(P/folder/f'{i:03}.png').convert('RGB') for i in range(36)]
    palette=frames[13].quantize(colors=256);colors=palette.getpalette()
    dark=min(range(256),key=lambda i:sum(colors[i*3:i*3+3]));colors[dark*3:dark*3+3]=[0,0,0];palette.putpalette(colors)
    encoded=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
    encoded[0].save(P/name,save_all=True,append_images=encoded[1:],duration=[100 if i%6==0 else 80 for i in range(36)],optimize=False)
    frames[-1].save(P/(name.replace('.gif','-finish.png')))
