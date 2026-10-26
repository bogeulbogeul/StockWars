from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
for source,name in [('rear-frames','eat-rear'),('opposite-side-frames','eat-opposite-side')]:
    frames=[Image.open(P/source/f'{i:03}.png').convert('RGB') for i in range(36)]
    palette=frames[13].quantize(colors=256)
    encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
    encoded[0].save(P/f'{name}.gif',save_all=True,append_images=encoded[1:],
        duration=[100 if i%6==0 else 80 for i in range(36)],loop=0,optimize=False)
    sheet=Image.new('RGB',(960,1040))
    for n,i in enumerate([0,13,23,32]):sheet.paste(frames[i],((n%2)*480,(n//2)*520))
    sheet.save(P/f'{name}-inspection.png')
    zoom=Image.new('RGB',(1200,900))
    for i,frame in enumerate(frames):
        crop=frame.crop((160,235,320,295)).resize((200,100))
        zoom.paste(crop,((i%6)*200,(i//6)*150))
    zoom.save(P/f'{name}-junction-all-frames.png')
