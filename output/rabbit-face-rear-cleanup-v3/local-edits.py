"""Prepare local native patches and explicit sprite-gen material bakes."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from sprite_gen.frames.extract import extract_component_images,resize_cell

ROOT=Path(__file__).parent
OLD=ROOT.parent/'rabbit-tail-occlusion-v2/rabbit/run'
M=json.loads((OLD/'manifest.json').read_text(encoding='utf-8'))
PAL=np.array(json.loads((ROOT/'palette.json').read_text(encoding='utf-8'))['rgb'],dtype=np.int32)
BASE=np.array([202,162,137])
NOSE=np.array([97,55,42])

def write(name,data):
    (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def frame(state,i):return Image.open(OLD/f'frames/{state}/frame-{i}.png').convert('RGBA')

def patch_map(canvas,name,palette=None,fixed=None):
    a=np.array(canvas);colors=np.unique(a[a[:,:,3]>0,:3],axis=0).astype(np.int32)
    if fixed is not None:targets=np.repeat(fixed[None,:],len(colors),axis=0)
    else:
        dist=((colors[:,None,:]-palette[None,:,:])**2).sum(axis=2)
        targets=palette[dist.argmin(axis=1)]
        if name=='eyes':
            # The inherited palette has very few iris mid-tones. A clean flat
            # iris prevents nearest-color quantization from making dark bands.
            iris=(colors[:,0]>38)&(colors[:,0]<185)&(colors[:,1]<130)&(colors[:,2]<110)
            targets[iris]=[133,75,57]
            targets[colors.max(axis=1)<39]=[11,2,2]
            targets[colors.min(axis=1)>210]=[252,252,251]
    hx=lambda c:'#'+''.join(f'{int(v):02x}' for v in c)
    write(f'{name}-spec.json',{'version':1,'kind':'sprite-gen-recolor','match':'exact','tolerance':0,
          'variants':[{'name':name,'map':{hx(c):hx(t) for c,t in zip(colors,targets)}}]})
    canvas.save(ROOT/f'{name}-patches.png')

def insert(canvas,patch,state,i):
    r=M['frame_layout']['rows'][state][i]
    canvas.paste(patch,(r['x'],r['y']))

def register(part,original):
    # Registration only supplies local retouch pixels. Original silhouette is
    # retained separately and no limb/head geometry is taken from the retake.
    box=original.getbbox();p=part.crop(part.getbbox())
    p=resize_cell(p,(box[2]-box[0],box[3]-box[1]))
    out=Image.new('RGBA',original.size);out.paste(p,box[:2]);return out

def prepare():
    rear=Image.new('RGBA',(1280,4000));eyes=Image.new('RGBA',rear.size);nose=Image.new('RGBA',rear.size)
    tails=Image.new('RGBA',rear.size)
    masks={};registrations=[]
    parts=extract_component_images(Image.open(ROOT/'native/rear3.png').convert('RGBA'),3)
    assert parts is not None and len(parts)==3
    (ROOT/'native-components').mkdir(exist_ok=True)
    regions=[(120,221,188,287),(127,226,192,289),(131,221,197,287)]
    tailparts=extract_component_images(Image.open(ROOT/'native/tail3.png').convert('RGBA'),1)
    assert tailparts is not None and len(tailparts)==1
    tail=tailparts[0].crop(tailparts[0].getbbox())
    tail=resize_cell(tail,(44,46))
    tailbase=Image.new('RGBA',tail.size,tuple(int(v) for v in BASE)+(255,))
    tailbase.alpha_composite(tail)
    tailcenters=[(160,247),(160,252),(160,247)]
    for i,p in enumerate(parts):
        p.save(ROOT/f'native-components/rear-{i}.png')
        original=frame('up_walk',i);a=np.asarray(original)
        native=register(p,original);b=np.array(native)
        x0,y0,x1,y1=regions[i]
        mask=np.zeros((400,320),dtype=np.uint8);mask[y0:y1,x0:x1]=255
        # Remove the old side-shifting puff together with the stacked crease.
        # Original arms, legs and all outer silhouette pixels remain protected.
        mask[a[:,:,3]==0]=0
        gap=np.where(a[:,:,3]==0,255,0).astype(np.uint8)
        near_gap=np.asarray(Image.fromarray(gap).filter(ImageFilter.MaxFilter(5)))>0
        mask[near_gap]=0
        b[:,:,3]=mask
        insert(rear,Image.fromarray(b),'up_walk',i)
        cx,cy=tailcenters[i]
        tp=Image.new('RGBA',(320,400));tp.paste(tailbase,(cx-22,cy-23))
        insert(tails,tp,'up_walk',i)
        masks[f'up_walk/{i}']={'rear_region':regions[i],'tail_center':[cx,cy],'tail_box':[cx-22,cy-23,cx+22,cy+23]}
    original=frame('face_portrait',0)
    p=extract_component_images(Image.open(ROOT/'native/portrait3.png').convert('RGBA'),1)
    assert p is not None and len(p)==1
    p[0].save(ROOT/'native-components/portrait.png')
    b=np.array(register(p[0],original))
    mask=Image.new('L',(320,400));d=ImageDraw.Draw(mask)
    left=[(53,252),(67,246),(88,245),(111,251),(125,263),(131,283),(124,304),(108,315),(83,313),(65,304),(55,284)]
    right=[(320-x,y) for x,y in left]
    d.polygon(left,fill=255);d.polygon(right,fill=255)
    b[:,:,3]=np.asarray(mask)
    insert(eyes,Image.fromarray(b),'face_portrait',0)
    masks['face_portrait/0']={'eye_polygons':[left,right]}
    for state,count in [('down_walk',3),('right_walk',3),('right_carry',4),('down_sit',1),('right_sit',1),('face_portrait',1)]:
        for i in range(count):
            a=np.array(frame(state,i));front=state.startswith('down')
            xa,xb,ya,yb=(145,174,168,184) if front else (192,222,162,181)
            if state=='down_sit':ya,yb=172,188
            if state=='face_portrait':xa,xb,ya,yb=138,182,307,338
            # Nose is the widest single dark horizontal run below the eyes.
            runs=[]
            for y in range(ya,yb):
                dark=(a[y,xa:xb,:3].mean(axis=1)<135)&(a[y,xa:xb,3]>200)
                xs=np.flatnonzero(dark)
                for run in np.split(xs,np.flatnonzero(np.diff(xs)>1)+1):
                    if len(run):runs.append((len(run),y,int(run[0])+xa,int(run[-1])+xa))
            width,yp,xl,xr=max(runs,key=lambda r:(r[0],-r[1]))
            assert width>=10,(state,i,'nose not found')
            # Include the highlight at the upper nose edge, not only its
            # widest central row; otherwise an orange strip survives above it.
            top=min(r[1] for r in runs if r[0]>=width*.6 and abs((r[2]+r[3])-(xl+xr))<8)
            ytop=top-1;bottom=yp+(17 if state=='face_portrait' else 8)
            region=np.zeros((400,320),dtype=bool);region[ytop:bottom,xl:xr+1]=True
            # Preserve the black outline/nostrils and cream surrounding fur.
            rgb=a[:,:,:3].astype(np.int32)
            selected=region&(rgb[:,:,0]>42)&(rgb[:,:,0]<190)&(rgb[:,:,1]<140)&(rgb[:,:,2]<120)&(rgb.mean(axis=2)>31)
            b=a.copy();b[:,:,3]=np.where(selected,a[:,:,3],0)
            insert(nose,Image.fromarray(b),state,i)
            masks[f'{state}/{i}']={**masks.get(f'{state}/{i}',{}),'nose_box':[xl,ytop,xr+1,bottom], 'nose_pixels':int(selected.sum())}
    patch_map(rear,'rear',fixed=BASE)
    patch_map(eyes,'eyes',palette=PAL)
    patch_map(nose,'nose',fixed=NOSE)
    patch_map(tails,'tail',palette=PAL)
    write('local-regions.json',masks)
    print(json.dumps(masks,ensure_ascii=False))

if __name__=='__main__':prepare()
