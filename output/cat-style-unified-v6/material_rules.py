"""One shared material/line classification for every complete sprite frame."""
from collections import deque
import numpy as np

TARGETS={1:[65,59,62],2:[51,45,48],3:[51,45,48],4:[92,81,85],
         5:[2,1,2],6:[254,157,120],7:[238,137,104],8:[249,249,249],9:[249,166,8]}
NAMES={1:'fur',2:'thin-internal-line',3:'ear-back-shadow',4:'eyebrow',
       5:'outline',6:'inner-ear',7:'inner-ear-shadow',8:'eye-white',9:'iris-gold'}
HEAD_END={'down_idle':238,'down_walk':238,'right_idle':235,'right_walk':235,
          'up_idle':236,'up_walk':236,'right_carry':225,'down_sit':294,
          'right_sit':290,'face_portrait':488}

def seeded_region(mask,seeds):
    result=mask & seeds
    queue=deque(map(tuple,np.argwhere(result)))
    h,w=mask.shape
    while queue:
        y,x=queue.popleft()
        for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0<=yy<h and 0<=xx<w and mask[yy,xx] and not result[yy,xx]:
                result[yy,xx]=True
                queue.append((yy,xx))
    return result

def equal(rgb,color):
    return np.all(rgb==color,axis=2)

def classify(frame,state):
    rgb=frame[:,:,:3].astype(np.int16)
    alpha=frame[:,:,3]
    used=alpha>0
    solid=alpha>128
    gray=rgb.max(axis=2)-rgb.min(axis=2)<25
    r=rgb[:,:,0]
    roles=np.zeros(used.shape,dtype=np.uint8)
    # All old broad shade patches become one common fur material. True thin
    # creases are restored below only when brighter fur exists on BOTH sides;
    # a rectangular/step-shaped shade boundary fails that test.
    roles[used & gray & (r>=40) & (r<=112)]=1
    roles[used & gray & (r<40)]=5
    thin=np.zeros(used.shape,bool)
    for radius in (2,3,4):
        for dy,dx in ((0,radius),(radius,0),(radius,radius),(radius,-radius)):
            a=np.roll(r,(dy,dx),(0,1)); b=np.roll(r,(-dy,-dx),(0,1))
            valid=np.roll(solid,(dy,dx),(0,1)) & np.roll(solid,(-dy,-dx),(0,1))
            thin |= (a>=r+8) & (b>=r+8) & valid
    # Old quantized shading contains scattered dark pixels; preserve the
    # original near-black contour instead of reintroducing those speckles.
    yy,xx=np.indices(used.shape)
    top=int(np.where(used)[0].min())
    head_end=HEAD_END[state]
    height=head_end-top
    ear_candidate=used & gray & (r>=40) & (r<=58)
    ear_seed=yy < top+height*0.30
    if not state.startswith('up_'):
        brow_candidate=used & equal(rgb,[92,81,85])
        brow_seed=(yy>=top+height*.38) & (yy<=top+height*.62)
        roles[seeded_region(brow_candidate,brow_seed)]=4
        nose_candidate=used & equal(rgb,[28,22,22])
        nose_seed=(yy>=top+height*.60) & (yy<=head_end)
        roles[seeded_region(nose_candidate,nose_seed)]=0
    for c in ([254,163,124],[254,157,120],[241,167,134],[253,165,138]):
        roles[used & equal(rgb,c)]=6
    roles[used & equal(rgb,[238,137,104])]=6
    for c in ([249,249,249],[250,250,250]):
        roles[used & equal(rgb,c)]=8
    for c in ([237,153,8],[249,166,8],[216,140,41]):
        roles[used & equal(rgb,c)]=9
    return roles
