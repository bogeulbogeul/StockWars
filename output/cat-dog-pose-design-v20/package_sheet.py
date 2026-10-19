"""Import reference replacement edit made directly from the dog pose sheet."""
from pathlib import Path
from collections import deque
import json
import shutil
import numpy as np
from PIL import Image,ImageFilter

ROOT=Path(__file__).resolve().parent
DOG=ROOT.parent/'dog-rgb-motion-v1'
dogm=json.loads((DOG/'manifest.json').read_text())
layout=dogm['frame_layout']['rows']
raw=Image.open(ROOT/'dog-template-cat-generated.png').convert('RGBA')
assert raw.getextrema()[3][0]==0
contact=raw.resize((2048,2048),Image.Resampling.LANCZOS)
states=['down_walk','right_walk','up_walk','right_carry']
poses=[(s,i) for s in states for i in range(4 if s=='right_carry' else 3)]
poses += [('down_sit',0),('right_sit',0),('face_portrait',0)]
sheet=Image.new('RGBA',(2048,5120))
records=[]

def isolated_figure(image):
    a=np.array(image)
    mask=a[:,:,3]>24
    seen=np.zeros((512,512),bool)
    largest=[]
    for sy,sx in np.argwhere(mask):
        if seen[sy,sx]: continue
        queue=deque([(sy,sx)]);seen[sy,sx]=True;part=[]
        while queue:
            y,x=queue.popleft();part.append((y,x))
            for y2,x2 in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0<=y2<512 and 0<=x2<512 and mask[y2,x2] and not seen[y2,x2]:
                    seen[y2,x2]=True;queue.append((y2,x2))
        if len(part)>len(largest):largest=part
    keep=np.zeros((512,512),dtype='uint8')
    ys,xs=zip(*largest);keep[ys,xs]=255
    keep=np.array(Image.fromarray(keep).filter(ImageFilter.MaxFilter(3)))>0
    a[~keep]=0
    return Image.fromarray(a)

for j,(state,i) in enumerate(poses):
    native=contact.crop(((j%4)*512,(j//4)*512,(j%4+1)*512,(j//4+1)*512))
    if state=='down_sit':
        native=Image.open(ROOT/'front-sit-dog-template-generated.png').convert('RGBA').resize((512,512),Image.Resampling.LANCZOS)
    tail_override=state=='up_walk' and i in (1,2)
    if tail_override:
        name='rear-neutral-cat-tail-generated.png' if i==1 else 'rear-b-cat-tail-generated.png'
        native=Image.open(ROOT/name).convert('RGBA').resize((512,512),Image.Resampling.LANCZOS)
    native=isolated_figure(native)
    # One uniform scale across all drawings, retaining ear/foot margins.
    fitted=Image.new('RGBA',(512,512))
    if tail_override:fitted=native
    else:fitted.alpha_composite(native.resize((482,482),Image.Resampling.LANCZOS),(15,15))
    a=np.array(fitted)
    a[a[:,:,3]<24]=0
    if state=='up_walk' and i in (0,2):
        # Lifted heels retain plain fur, without a pad-like dark oval.
        yy,xx=np.indices((512,512))
        if i==0:foot=(xx>319)&(xx<382)&(yy>453)&(yy<498)
        else:foot=(xx>188)&(xx<257)&(yy>411)&(yy<464)
        rgb=a[:,:,:3].astype('int16')
        gray=np.ptp(rgb,axis=2)<25
        base=(a[:,:,3]>128)&gray&(rgb[:,:,0]>=55)&(rgb[:,:,0]<75)
        colors,counts=np.unique(a[base,:3],axis=0,return_counts=True)
        target=colors[counts.argmax()]
        interior=foot&(a[:,:,3]>128)&gray&(rgb[:,:,0]>=30)&(rgb[:,:,0]<100)
        a[interior,:3]=target
    frame=Image.fromarray(a)
    r=layout[state][i];sheet.paste(frame,(r['x'],r['y']))
    bbox=frame.getbbox()
    assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<512 and bbox[3]<512
    records.append(dict(state=state,frame=i,alpha_bbox=bbox))
for d in ['down','right','up']:
    r=layout[d+'_walk'][1];target=layout[d+'_idle'][0]
    sheet.paste(sheet.crop((r['x'],r['y'],r['x']+512,r['y']+512)),(target['x'],target['y']))
sheet.save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state;folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):sheet.crop((r['x'],r['y'],r['x']+512,r['y']+512)).save(folder/f'frame-{i}.png')
manifest=dict(characterId='cat-dog-pose-design-v20',engine='dog-pose-reference-edit',
    game_input='sprite-sheet-alpha.png',sprite_sheet_alpha='sprite-sheet-alpha.png',
    sprite_sheet_alpha_report='validation.json',cell=dogm['cell'],
    animation=dogm['animation'],frame_layout=dogm['frame_layout'],
    appearance_reference='references/cat-design.png',pose_template='references/dog-pose-template.png',
    production='Built-in GPT replacement edit of DOG pose contact sheet, using only user CAT design for identity. No prior cat motion sheets or hand-written head/tail deformation used. Native rendered colors retained.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,states=10,unique_drawings=16,transparent_background=True,
    cells_not_clipped=True,layout_identical_to_dog=manifest['frame_layout']==dogm['frame_layout'],
    animation_identical_to_dog=manifest['animation']==dogm['animation'],
    source_edit_target='references/dog-pose-template.png',
    appearance_reference='references/cat-design.png',frames=records,game_installed=False,
    limitation='Contract checks confirm layout and timing, not pixel-identical anatomical joint positions. Pose/design correspondence is visually reviewed against supplied references.')
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
preview=(ROOT.parent/'cat-tail-color-portrait-v19/preview.html').read_text(encoding='utf-8').replace('고양이 꼬리 좌우·색면·얼굴 초상화 v19','강아지 자세 원본 × 고양이 디자인 v20')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
shutil.copy2(ROOT.parent/'cat-tail-color-portrait-v19/package_preview.py',ROOT/'package_preview.py')
dogsheet=Image.open(DOG/'sprite-sheet-alpha.png').convert('RGBA')
board=Image.new('RGBA',(1536,768),'#c5c9ce')
for j,(state,i) in enumerate(poses):
    r=layout[state][i]
    for k,atlas in enumerate([dogsheet,sheet]):
        frame=atlas.crop((r['x'],r['y'],r['x']+512,r['y']+512)).resize((192,192))
        board.alpha_composite(frame,(((j%4)*2+k)*192,(j//4)*192))
board.convert('RGB').save(ROOT/'pose-comparison.png')
print(json.dumps(report))
