"""Clean flat material planes and GPT-corrected front head motion."""
from pathlib import Path
from collections import deque
import json
import shutil
import numpy as np
from PIL import Image,ImageFilter

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-color-consistent-v14'
manifest=json.loads((SOURCE/'manifest.json').read_text())
oldmanifest=json.loads(json.dumps(manifest))
layout=manifest['frame_layout']['rows']
source=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
working=source.copy()
raw=Image.open(ROOT/'front-head-generated.png').convert('RGBA')
row=raw.resize((1536,512),Image.Resampling.LANCZOS)
dogm=json.loads((ROOT.parent/'dog-rgb-motion-v1/manifest.json').read_text())
dogsheet=np.array(Image.open(ROOT.parent/'dog-rgb-motion-v1/sprite-sheet-alpha.png'))
head_angles=[]

def cell(a,r):
    return a[r['y']:r['y']+512,r['x']:r['x']+512]

def eye_angle(a):
    yy,xx=np.indices(a.shape[:2])
    white=(a[:,:,:3].min(axis=2)>235)&(a[:,:,3]>128)&(yy>95)&(yy<230)
    left=np.argwhere(white&(xx>165)&(xx<250)).mean(axis=0)
    right=np.argwhere(white&(xx>265)&(xx<350)).mean(axis=0)
    return float(np.degrees(np.arctan2(right[0]-left[0],right[1]-left[1])))

def head_only(a):
    mask=a[:,:,3]>24
    mask[250:]=False
    seen=np.zeros(mask.shape,bool)
    largest=[]
    for sy,sx in np.argwhere(mask):
        if seen[sy,sx]: continue
        queue=deque([(sy,sx)]);seen[sy,sx]=True;component=[]
        while queue:
            y,x=queue.popleft();component.append((y,x))
            for y2,x2 in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0<=y2<250 and 0<=x2<512 and mask[y2,x2] and not seen[y2,x2]:
                    seen[y2,x2]=True;queue.append((y2,x2))
        if len(component)>len(largest): largest=component
    keep=np.zeros(mask.shape,dtype='uint8')
    ys,xs=zip(*largest);keep[ys,xs]=255
    keep=np.array(Image.fromarray(keep).filter(ImageFilter.MaxFilter(3)))>0
    keep[250:]=False
    out=a.copy();out[~keep]=0
    return out

# Only the head/neck portion of the three front poses is re-edited.
for i,r in enumerate(layout['down_walk'][:3]):
    generated=np.array(row.crop((i*512,0,(i+1)*512,512)))
    generated[generated[:,:,3]<24]=0
    angle=eye_angle(generated)
    dog_angle=eye_angle(cell(dogsheet,dogm['frame_layout']['rows']['down_walk'][i]))
    # The generated tilt was exaggerated; match measured dog eye-line slope.
    generated=head_only(generated)
    generated=np.array(Image.fromarray(generated).rotate(angle-dog_angle,
        resample=Image.Resampling.BICUBIC,center=(256,190)))
    generated[generated[:,:,3]<24]=0
    bbox=Image.fromarray(generated).getbbox()
    anchored=Image.new('RGBA',(512,512))
    anchored.alpha_composite(Image.fromarray(generated),(0,250-bbox[3]))
    generated=np.array(anchored)
    head_angles.append(dict(frame=i,generated_degrees=angle,target_dog_degrees=dog_angle,
                            final_degrees=eye_angle(generated)))
    base=cell(working,r).copy()
    previous_head=head_only(base)
    base[previous_head[:,:,3]>0]=0
    # Preserve the original central neck coverage behind the tilted head;
    # rotating a clipped head layer otherwise exposes a triangular gap.
    neck=previous_head[225:250,218:300].copy()
    neck[:,:,:3]=[65,59,62]
    base[225:250,218:300]=neck
    composed=Image.fromarray(base)
    composed.alpha_composite(Image.fromarray(generated))
    cell(working,r)[:250]=np.array(composed)[:250]

def clean(frame):
    a=frame.copy()
    rgb=a[:,:,:3].astype('int16')
    used=a[:,:,3]>0
    smooth=np.array(Image.fromarray(a[:,:,:3]).filter(ImageFilter.MedianFilter(5)))
    neutral=np.ptp(rgb,axis=2)<30
    fur=used&neutral&(rgb[:,:,0]>=30)&(rgb[:,:,0]<85)
    level=smooth[:,:,0]
    # Three clean cel planes, same on every frame. Filtering precedes
    # classification so micro-fluctuations cannot produce scattered speckles.
    label=np.ones(level.shape,dtype='uint8')
    label[level<58]=0
    label[level>70]=2
    label=np.array(Image.fromarray(label).filter(ImageFilter.MedianFilter(9)))
    visited=np.zeros(label.shape,bool)
    for sy,sx in np.argwhere(fur&(label!=1)):
        if visited[sy,sx]: continue
        value=label[sy,sx];queue=deque([(sy,sx)]);visited[sy,sx]=True;component=[]
        while queue:
            y,x=queue.popleft();component.append((y,x))
            for y2,x2 in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0<=y2<512 and 0<=x2<512 and fur[y2,x2] and not visited[y2,x2] and label[y2,x2]==value:
                    visited[y2,x2]=True;queue.append((y2,x2))
        if len(component)<80:
            ys,xs=zip(*component);label[ys,xs]=1
    palette=np.array([[51,45,48],[65,59,62],[73,66,70]],dtype='uint8')
    a[fur,:3]=palette[label[fur]]
    brow=used&neutral&(rgb[:,:,0]>=85)&(rgb[:,:,0]<125)
    a[brow,:3]=[92,81,85]
    ink=used&neutral&(rgb[:,:,0]<30)
    a[ink,:3]=[2,1,2]
    pink=used&(rgb[:,:,0]>150)&(rgb[:,:,1]>65)&(rgb[:,:,2]>60)&(rgb[:,:,0]>rgb[:,:,1]*1.2)
    a[pink,:3]=[254,157,120]
    return a

edited=working.copy()
seen=set()
records=[]
for state,rows in layout.items():
    for i,r in enumerate(rows):
        key=(r['x'],r['y'])
        if key in seen:
            continue
        seen.add(key)
        cell(edited,r)[:]=clean(cell(working,r))
        records.append(dict(state=state,frame=i))
for d in ['down','right','up']:
    cell(edited,layout[d+'_idle'][0])[:]=cell(edited,layout[d+'_walk'][1])
for state,rows in layout.items():
    if state not in ['down_walk','down_idle']:
        for r in rows:
            assert np.array_equal(cell(source,r)[:,:,3],cell(edited,r)[:,:,3])
for r in layout['down_walk'][:3]:
    assert np.array_equal(cell(source,r)[250:,:,3],cell(edited,r)[250:,:,3])
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        Image.fromarray(cell(edited,r)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-clean-motion-v15',production='GPT front head counter-sway edit using dog pose row. Common median-cleaned three-plane charcoal fur, no continuous fur RGB noise. All non-front geometry and all front lower-body alpha preserved.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,states=10,physical_drawings=len(records),
    nonfront_alpha_identical=True,front_lower_body_alpha_identical=True,
    layout_identical=manifest['frame_layout']==oldmanifest['frame_layout'],
    animation_identical=manifest['animation']==oldmanifest['animation'],
    common_fur_rgb=[[51,45,48],[65,59,62],[73,66,70]],
    head_eye_angles=head_angles,
    note='Head/neck pixels in front poses are intentionally edited. All material cleanup preserves the existing body/limb pose.',game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(ROOT/'preview.html').write_text((SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 전체 PNG 공통 RGB v14','고양이 정면 머리 리듬·색면 정리 v15'),encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
