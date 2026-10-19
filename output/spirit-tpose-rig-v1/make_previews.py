from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent
for name,ms in [('walk',83),('wave',125),('eat',125)]:
    frames=[Image.open(p).convert('RGB') for p in sorted((root/name).glob('*.png'))]
    frames[0].save(root/(name+'.gif'),save_all=True,append_images=frames[1:],duration=ms,loop=0)
images=[Image.open(root/(n+'.png')).convert('RGB') for n in ['tpose','walk_a','wave','eat']]
board=Image.new('RGB',(1280,320))
for i,im in enumerate(images):board.paste(im.resize((320,320)),(i*320,0))
board.save(root/'overview.png')
