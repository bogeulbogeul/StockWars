from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
for folder,name in [('side-frames','eat-side'),('opposite-side-frames','eat-opposite-side')]:
    frames=[Image.open(P/folder/f'{i:03}.png').convert('RGB') for i in range(36)]
    palette=frames[13].quantize(colors=256)
    encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
    encoded[0].save(P/f'{name}.gif',save_all=True,append_images=encoded[1:],
        duration=[100 if i%6==0 else 80 for i in range(36)],loop=0,optimize=False)
    sheet=Image.new('RGB',(1200,960),(76,76,76))
    for i,frame in enumerate(frames):
        crop=frame.crop((140,240,330,345)).resize((200,150))
        sheet.paste(crop,((i%6)*200,(i//6)*160))
    sheet.save(P/f'{name}-all-frames.png')
