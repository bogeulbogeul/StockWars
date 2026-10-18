"""Limited, spatially cleaned common fur colors; brows anatomically scoped."""
import numpy as np
from collections import deque
from PIL import Image,ImageFilter

def clean(a,state):
    a=a.copy()
    rgb=a[:,:,:3].astype('int16')
    used=a[:,:,3]>0
    neutral=np.ptp(rgb,axis=2)<35
    smooth=np.array(Image.fromarray(a[:,:,:3]).filter(ImageFilter.MedianFilter(5)))
    fur=used&neutral&(rgb[:,:,0]>=18)&(rgb[:,:,0]<125)
    label=np.ones((512,512),dtype='uint8')
    label[smooth[:,:,0]<53]=0
    label[smooth[:,:,0]>70]=2
    label=np.array(Image.fromarray(label).filter(ImageFilter.MedianFilter(7)))
    ink=used&neutral&(rgb[:,:,0]<18)
    near_ink=np.array(Image.fromarray(ink.astype('uint8')*255).filter(ImageFilter.MaxFilter(5)))>0
    seen=np.zeros((512,512),bool)
    for sy,sx in np.argwhere(fur&(label!=1)):
        if seen[sy,sx]: continue
        value=label[sy,sx];queue=deque([(sy,sx)]);seen[sy,sx]=True;part=[]
        while queue:
            y,x=queue.popleft();part.append((y,x))
            for y2,x2 in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0<=y2<512 and 0<=x2<512 and fur[y2,x2] and not seen[y2,x2] and label[y2,x2]==value:
                    seen[y2,x2]=True;queue.append((y2,x2))
        ys,xs=zip(*part)
        head_end=285 if state.endswith('sit') else 245
        floating_body=value==0 and min(ys)>head_end and (len(part)<2000 or int(near_ink[ys,xs].sum())<12)
        if len(part)<300 or floating_body: label[ys,xs]=1
    palette=np.array([[51,45,48],[65,59,62],[73,66,70]],dtype='uint8')
    yy,xx=np.indices((512,512))
    if not state.startswith('up_') and state!='face_portrait':
        label[(yy>390)&(xx>150)&(xx<350)&(label==0)]=1
    a[fur,:3]=palette[label[fur]]
    if state=='face_portrait': region=(yy>205)&(yy<270)&(xx>140)&(xx<365)
    elif state=='right_sit': region=(yy>153)&(yy<200)&(xx>260)&(xx<380)
    elif state=='down_sit': region=(yy>150)&(yy<205)&(xx>180)&(xx<350)
    elif state.startswith('down_'): region=(yy>120)&(yy<165)&(xx>180)&(xx<345)
    else: region=(yy>110)&(yy<165)&(xx>290)&(xx<380)
    brow=fur&(rgb[:,:,0]>=80)&region
    if state.startswith('up_'): brow[:]=False
    a[brow,:3]=[92,81,85]
    a[used&neutral&(rgb[:,:,0]<18),:3]=[2,1,2]
    pink=used&(rgb[:,:,0]>150)&(rgb[:,:,1]>65)&(rgb[:,:,2]>60)&(rgb[:,:,0]>rgb[:,:,1]*1.2)
    a[pink,:3]=[254,157,120]
    assert set(map(tuple,np.unique(a[fur&~brow,:3],axis=0)))<=set(map(tuple,palette))
    return a
