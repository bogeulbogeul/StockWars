import json
from pathlib import Path
from PIL import Image
root=Path(__file__).parent
rows={s:[(s,i) for i in range(3)] for s in ['down_walk','right_walk','up_walk']}
rows['right_carry']=[('right_carry',i) for i in range(4)]
rows['static_poses']=[('down_sit',0),('right_sit',0),('face_portrait',0)]
for name,frames in rows.items():
    board=Image.new('RGBA',(320*len(frames),400),(0,255,255,255))
    for x,(state,i) in enumerate(frames):
        board.alpha_composite(Image.open(root/f'red-fox/run/frames/{state}/frame-{i}.png').convert('RGBA'),(320*x,0))
    board.convert('RGB').save(root/f'raw/{name}-reference.png')
(root/'row-map.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
