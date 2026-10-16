"""Assemble existing dog motion reference rows, not generated cat sprite cuts."""
from pathlib import Path
from PIL import Image

root=Path(__file__).parent
dog=root.parent/'dog-hidden-hand-v9/dog/run/frames'
(root/'refs').mkdir(parents=True,exist_ok=True)
rows={s:[(s,i) for i in range(n)] for s,n in [('down_walk',3),('right_walk',3),('up_walk',3),('right_carry',4)]}
rows['static_poses']=[('down_sit',0),('right_sit',0),('face_portrait',0)]
for name,row in rows.items():
    im=Image.new('RGBA',(320*len(row),400),(0,255,255,255))
    for x,(s,i) in enumerate(row):
        im.alpha_composite(Image.open(dog/s/f'frame-{i}.png').convert('RGBA'),(x*320,0))
    im.convert('RGB').save(root/f'refs/{name}.png')
