from pathlib import Path
from PIL import Image
from statistics import median
from sprite_gen.curate.curation import empty_curation, stamp_curation, write_curation_atomic

run = Path(__file__).resolve().parent.parent / 'output/energy-drink-opening-v2'
measurements=[]
for index in range(10):
    image=Image.open(run/f'frames/open/frame-{index}.png').convert('RGBA')
    alpha=image.getchannel('A')
    bottom=alpha.getbbox()[3]
    widths=[]
    for y in range(bottom-130,bottom-50):
        xs=[x for x in range(image.width) if alpha.getpixel((x,y))>128]
        if xs: widths.append(max(xs)-min(xs)+1)
    measurements.append((median(widths),bottom))
target=min(width for width,bottom in measurements)
doc=empty_curation()
doc['pixel_unfake']=False
doc['states']={'open':{'selected':list(range(10)),'transforms':{}}}
for index,(width,bottom) in enumerate(measurements):
    scale=target/width
    doc['states']['open']['transforms'][str(index)]={'scale':scale,'dy':340-(192+scale*(bottom-192)),'dx':0}
write_curation_atomic(run,stamp_curation(run,doc))
print('Body-width and bottom-baseline curation:',measurements)
