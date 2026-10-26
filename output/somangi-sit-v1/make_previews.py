from pathlib import Path
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent
frames={}
timing=[70,60,70]*14
for view in ['front','side']:
    paths=sorted((P/(view+'-frames')).glob('*.png'))
    assert len(paths)==42,(view,len(paths))
    frames[view]=[Image.open(path).convert('RGB') for path in paths]
    frames[view][0].save(P/(view+'.gif'),save_all=True,append_images=frames[view][1:],duration=timing,loop=0,disposal=2)
combined=[]
for a,b in zip(frames['front'],frames['side']):
    image=Image.new('RGB',(880,520));image.paste(a,(0,0));image.paste(b,(440,0));combined.append(image)
combined[0].save(P/'sit-preview.gif',save_all=True,append_images=combined[1:],duration=timing,loop=0,disposal=2)
sheet=Image.new('RGB',(1760,1040))
for row,view in enumerate(['front','side']):
    for col,index in enumerate([0,10,20,35]):sheet.paste(frames[view][index],(col*440,row*520))
sheet.save(P/'contact-sheet.png')
Image.open(P/'angle-frames/024.png').save(P/'seated-angle.png')
print('SIT_PREVIEW_COMPLETE')
