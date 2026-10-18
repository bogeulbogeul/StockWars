"""Register local occlusion mattes to original contour pixels.

Native edited rows specify the hidden-tail silhouettes. Their RGB is not used:
manual local matte registration preserves every surviving original RGBA pixel.
This is explicit alpha compositing, not limb generation or a motion repair.
"""
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
from sprite_gen.frames.extract import extract_component_images
import build

ROOT=Path(__file__).parent
SOURCE=ROOT.parent/'rabbit-dog-baseline-v1/rabbit/run'
# Reviewed contour anchors: (y, x), on existing arm/hip outline, not on tail.
PATHS={
 ('down_walk',0):[(205,114),(210,110),(215,107),(220,104),(225,100),(230,96),(235,92),(240,89),(245,87),(250,85),(255,83),(260,81),(265,83)],
 ('down_walk',1):[(210,116),(215,112),(220,109),(225,105),(230,102),(235,99),(240,96),(245,93),(250,91),(255,89),(260,88),(265,87)],
 ('down_walk',2):[(207,207),(212,210),(217,214),(222,218),(227,221),(232,225),(237,228),(242,230),(247,233),(252,235),(257,237),(264,237)],
 ('right_walk',0):[(210,118),(215,113),(220,107),(225,103),(230,98),(235,94),(240,90),(245,84),(250,80),(255,78),(260,76),(265,79)],
 ('right_walk',1):[(210,129),(215,126),(220,123),(225,119),(230,116),(235,114),(240,111),(245,109),(250,107),(255,105),(260,103),(265,101),(270,101)],
 ('right_walk',2):[(215,134),(220,134),(225,134),(230,134),(235,132),(240,131),(245,129),(250,126),(255,123),(260,120),(265,119),(270,118),(275,116)],
 ('right_carry',0):[(210,132),(220,131),(225,130),(230,129),(235,128),(240,127),(245,125),(250,122),(255,119),(260,118),(265,117),(272,117)],
 ('right_carry',1):[(210,134),(220,134),(225,133),(230,132),(235,131),(240,130),(245,127),(250,124),(255,122),(260,121),(265,121),(272,121)],
 ('right_carry',2):[(210,135),(220,134),(225,133),(230,133),(235,131),(240,130),(245,129),(250,126),(255,123),(260,121),(265,120),(270,120),(275,119)],
 ('right_carry',3):[(207,136),(215,135),(220,134),(225,134),(230,132),(235,131),(240,130),(245,128),(250,125),(255,124),(260,124),(265,125),(270,127)],
 ('right_sit',0):[(225,126),(230,124),(235,122),(240,121),(245,120),(250,121),(255,119),(260,117),(265,115),(270,114),(275,114),(280,115)],
}

def apply():
    records=[]
    for (state,i),anchors in PATHS.items():
        src=Image.open(SOURCE/f'frames/{state}/frame-{i}.png').convert('RGBA')
        a=np.array(src)
        matte=np.full(a.shape[:2],255,dtype=np.uint8)
        right=(state=='down_walk' and i==2)
        coords=[]
        for y in range(anchors[0][0],anchors[-1][0]+1):
            expected=np.interp(y,[p[0] for p in anchors],[p[1] for p in anchors])
            # Explicit reviewed matte anchors avoid selecting a tail-tip line
            # or the inner arm contour where dark strokes meet at the root.
            cut=round(expected)
            # Preserve original black contour; only remove exterior tail pixels.
            if right:
                matte[y,cut+1:280]=0
            else:
                matte[y,60:max(60,cut-1)]=0
            coords.append([y,cut])
        changed=(matte==0)&(a[:,:,3]>0)
        a[matte==0,3]=0
        out=Image.fromarray(a)
        out.save(build.RUN/f'frames/{state}/frame-{i}.png')
        (ROOT/'mattes'/state).mkdir(parents=True,exist_ok=True)
        Image.fromarray(matte).save(ROOT/f'mattes/{state}/frame-{i}.png')
        records.append({'state':state,'frame':i,'removed_pixels':int(changed.sum()),'contour':coords})
    for direction in ['down','right']:
        shutil.copy2(build.RUN/f'frames/{direction}_walk/frame-1.png',build.RUN/f'frames/{direction}_idle/frame-0.png')
    build.write(ROOT/'matte-registration.json',{'method':'Native tail-occluded silhouette, manually registered local alpha matte snapped to original dark contour; RGB never replaced','frames':records})

def extract_native():
    # Canonical component extraction preserves native evidence separately;
    # these generated RGB values never replace accepted frame colors.
    for state,count in [('down_walk',3),('right_walk',3),('right_carry',4),('right_sit-retake',1)]:
        parts=extract_component_images(Image.open(ROOT/f'native/{state}.png').convert('RGBA'),count)
        assert parts is not None and len(parts)==count,(state,'native component count')
        dst=ROOT/'native-components'/state;dst.mkdir(parents=True,exist_ok=True)
        for i,p in enumerate(parts):p.save(dst/f'frame-{i}.png')

if __name__=='__main__':
    extract_native()
    apply()
    build.compose()
