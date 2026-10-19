"""Native drawings -> sprite-gen component extraction -> explicit sheet layout.

No recoloring, limb warping, mirroring or pasted heads. Preview-only candidate.
"""
import base64
import json
from pathlib import Path
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw
from sprite_gen.frames.extract import remove_chroma_background, extract_component_images, resize_cell

HERE = Path(__file__).parent
ROOT = HERE.parents[1]
RUN = HERE / 'dog' / 'run'
OLD = ROOT / 'output/style-unification-v3/dog/run'
WALKS = ['down_walk', 'right_walk', 'up_walk']
LABELS = {'down_idle':'정면 정지','down_walk':'정면 걷기','right_idle':'사선 정지',
          'right_walk':'사선 걷기','up_idle':'뒤 정지','up_walk':'뒤 걷기',
          'right_carry':'운반','down_sit':'정면 앉기','right_sit':'사선 앉기',
          'face_portrait':'얼굴 초상화'}


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


def getparts(name, count):
    im = Image.open(HERE / 'raw' / f'{name}.png').convert('RGBA')
    alpha = remove_chroma_background(im, (0,255,255), 96,180,18)
    parts = extract_component_images(alpha, count)
    if parts is None or len(parts) != count:
        raise RuntimeError(f'{name}: expected {count} separate components')
    return [p.crop(p.getbbox()) for p in parts]


def head_width(p):
    a = np.asarray(p)[:,:,3] > 160
    h = p.height
    widths = []
    for y in range(int(h*.12), int(h*.29)):
        xs = np.flatnonzero(a[y])
        if xs.size:
            widths.append(int(xs[-1]-xs[0]+1))
    return float(np.median(widths))


def saveframe(state, i, part, scale, ground=372, center=160):
    sprite = resize_cell(part, (round(part.width*scale), round(part.height*scale)))
    # Align head centre rather than bounding-box centre, which moves with the tail.
    a = np.asarray(sprite)[:,:,3] > 160
    centers=[]
    for y in range(int(sprite.height*.12),int(sprite.height*.29)):
        xs=np.flatnonzero(a[y])
        if xs.size:
            centers.append((int(xs[0])+int(xs[-1]))/2)
    left=round(center-np.median(centers))
    top=ground-sprite.height
    if left<2 or top<2 or left+sprite.width>318 or ground>398:
        raise RuntimeError((state,i,'clipping',left,top,sprite.size))
    out=Image.new('RGBA',(320,400))
    out.alpha_composite(sprite,(left,top))
    path=RUN/f'frames/{state}/frame-{i}.png'
    path.parent.mkdir(parents=True,exist_ok=True)
    out.save(path)
    return out


def extract():
    placement=[]
    for state in WALKS:
        parts=getparts(state,3)
        scale=340/parts[1].height
        for i,p in enumerate(parts):
            saveframe(state,i,p,scale)
        if state=='right_walk' and (HERE/'raw/right_B.png').exists():
            p=getparts('right_B',1)[0]
            # Independent native phase retake registered by head size, not total height.
            bscale=head_width(parts[1])*scale/head_width(p)
            saveframe(state,2,p,bscale)
        idle=state.replace('_walk','_idle')
        dst=RUN/f'frames/{idle}/frame-0.png'
        dst.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(RUN/f'frames/{state}/frame-1.png',dst)
        placement.append({'state':state,'scale':scale,'component_heights':[p.height for p in parts]})
    if (HERE/'raw/right_carry.png').exists():
        parts=getparts('right_carry',4)
        scale=340/np.median([p.height for p in parts])
        for i,p in enumerate(parts):
            saveframe('right_carry',i,p,scale)
    if (HERE/'raw/static_poses.png').exists():
        parts=getparts('static_poses',3)
        scale=min(180/head_width(parts[0]),340/max(p.height for p in parts[:2]))
        saveframe('down_sit',0,parts[0],scale)
        saveframe('right_sit',0,parts[1],scale)
        saveframe('face_portrait',0,parts[2],260/parts[2].width,ground=335)
    if (HERE/'raw/right_sit.png').exists():
        p=getparts('right_sit',1)[0]
        saveframe('right_sit',0,p,min(180/head_width(p),340/p.height))
    write(HERE/'placement.json',placement)


def compose():
    rows={}
    anim={}
    sheet=Image.new('RGBA',(1280,4000))
    oldsheet=Image.new('RGBA',sheet.size)
    for row,state in enumerate(LABELS):
        count=3 if state.endswith('_walk') else 4 if state=='right_carry' else 1
        rows[state]=[]
        for i in range(count):
            p=RUN/f'frames/{state}/frame-{i}.png'
            if not p.exists():
                raise RuntimeError(f'missing new candidate: {p}')
            r={'x':i*320,'y':row*400,'w':320,'h':400}
            rows[state].append(r)
            sheet.paste(Image.open(p),(r['x'],r['y']))
            oldsheet.paste(Image.open(OLD/f'frames/{state}/frame-{i}.png'),(r['x'],r['y']))
        anim[state]={'frames':count,'durations_ms':[160]*count,'loop':count>1,
                     'sequence':[0,1,2,1] if state.endswith('_walk') else list(range(count))}
    sheet.save(RUN/'sprite-sheet-alpha.png')
    oldsheet.save(HERE/'before.png')
    m={'characterId':'dog-motion-rebuild-v1','status':'design-candidate',
       'cell':{'width':320,'height':400},'animation':{'rows':anim},
       'frame_layout':{'sheetWidth':1280,'sheetHeight':4000,'rows':rows},
       'game_integrated':False,'tail_wag_extension':'existing adopted game asset retained separately; not part of this core redesign candidate'}
    write(RUN/'manifest.json',m)
    request={'provider':'built-in image_gen','engine':'component-row','character':{'id':m['characterId']},
             'cell':m['cell'],'chroma_key':{'rgb':[0,255,255]},'states':anim}
    write(RUN/'sprite-request.json',request)
    layout=[[(s,i) for i in range(3)]+[('face_portrait',0) if s=='down_walk' else ('down_sit',0) if s=='right_walk' else ('right_sit',0)] for s in WALKS]
    layout.append([('right_carry',i) for i in range(4)])
    board=Image.new('RGB',(1280,1680),'#eee9df')
    d=ImageDraw.Draw(board)
    for y,row in enumerate(layout):
        for x,(state,i) in enumerate(row):
            fr=Image.open(RUN/f'frames/{state}/frame-{i}.png').convert('RGBA')
            board.paste(fr,(x*320,y*420+20),fr)
            d.text((x*320+12,y*420+5),f'{state} / {i}',fill='#393329')
    board.save(HERE/'dog/review-final.png')
    template=(ROOT/'output/style-unification-v3/preview-template.html').read_text(encoding='utf-8')
    enc=lambda p:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
    items=[{'id':'dog','label':'강아지 기본 모션 재설계 시안','before':enc(HERE/'before.png'),
            'after':enc(RUN/'sprite-sheet-alpha.png'),'manifest':m}]
    template=template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__LABELS__',json.dumps(LABELS,ensure_ascii=False))
    template=template.replace('강아지·고양이 + 숲속 친구들 6종 · 실제 스프라이트 보정','강아지 · 기본 모션 재설계 시안')
    template=template.replace('동물 8종 · 색과 그림체 보정','강아지 · 기본 모션 재설계 시안')
    template=template.replace('보정 전</small>','현재 채택본</small>').replace('보정 후</small>','재설계 시안</small>')
    a=template.index('<p>');b=template.index('</p>',a)+4
    template=template[:a]+'<p>양발 교대 + 같은 쪽 팔·다리 반대 방향. 3자세 · A → 중립 → B → 중립 · 160ms.<br>발바닥 패드·별도 발바닥 면 없음. 게임 교체 전 시안이며 꼬리 대기 확장과 게임 접촉 검수는 포함하지 않습니다.</p>'+template[b:]
    template=template.replace('<label><input id="tail"','<label hidden><input id="tail"')
    template=template.replace('comparison.png','dog/review-final.png')
    (HERE/'preview.html').write_text(template,encoding='utf-8')
    for state in WALKS+['right_carry']:
        seq=anim[state]['sequence']
        frames=[]
        for i in seq:
            fr=Image.open(RUN/f'frames/{state}/frame-{i}.png').convert('RGBA')
            bg=Image.new('RGBA',fr.size,'#eee9df');bg.alpha_composite(fr)
            frames.append(bg.convert('RGB'))
        (HERE/'qa').mkdir(exist_ok=True)
        frames[0].save(HERE/f'qa/{state}.gif',save_all=True,append_images=frames[1:],duration=160,loop=0)
    print('Built 10-state core candidate, new drawings only; no game writes.')


if __name__=='__main__':
    RUN.mkdir(parents=True,exist_ok=True)
    extract()
    if '--extract-only' not in sys.argv:
        compose()
