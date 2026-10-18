"""Validate palette/animation contracts and emit readable comparisons."""
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent
shutil.copy2(root/'baked/cat-rgb-motion.png',root/'sprite-sheet-alpha.png')
manifest = json.loads((root/'manifest.json').read_text(encoding='utf-8'))
manifest['sprite_sheet_alpha']='sprite-sheet-alpha.png'
manifest['game_input']='sprite-sheet-alpha.png'
manifest['sprite_sheet_alpha_report']='baked/recolor.report.json'
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
sheet = Image.open(root/'sprite-sheet-alpha.png').convert('RGBA')
before = np.array(Image.open(root/'sprite-sheet-unbaked.png').convert('RGBA'))
after = np.array(sheet)
palette = json.loads((root/'palette-source.json').read_text(encoding='utf-8'))
allowed = {tuple(r['rgb']) for r in palette['colors']}
used = set(map(tuple,np.unique(after[after[:,:,3]>0,:3],axis=0)))
assert used<=allowed
assert np.array_equal(before[:,:,3],after[:,:,3])
layout=manifest['frame_layout']['rows']
def cut(im,r):
    return im.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
for direction in ['down','right','up']:
    assert cut(sheet,layout[direction+'_idle'][0]).tobytes()==cut(sheet,layout[direction+'_walk'][1]).tobytes()
    assert cut(sheet,layout[direction+'_walk'][0]).tobytes()!=cut(sheet,layout[direction+'_walk'][2]).tobytes()
for state,rects in layout.items():
    for i,r in enumerate(rects):
        frame=cut(sheet,r)
        assert frame.getbbox() is not None
        alpha=np.array(frame)[:,:,3]
        assert not any(np.any(edge) for edge in [alpha[0],alpha[-1],alpha[:,0],alpha[:,-1]])
        folder=root/'frames'/state
        folder.mkdir(exist_ok=True,parents=True)
        frame.save(folder/f'frame-{i}.png')
dogpath=root.parent/'dog-rgb-motion-v1'
dog=Image.open(dogpath/'sprite-sheet-alpha.png').convert('RGBA')
states=['down_walk','right_walk','up_walk','right_carry','down_sit','right_sit','face_portrait']
contact=Image.new('RGB',(1024,7*256),'#dddddd')
for row,state in enumerate(states):
    count=3 if state.endswith('_walk') else len(layout[state])
    for i,r in enumerate(layout[state][:count]):
        for im,y in [(dog,row*256),(sheet,row*256+128)]:
            frame=cut(im,r).resize((128,128))
            contact.paste(frame,(i*256,y),frame)
contact.save(root/'dog-cat-comparison.png')
report=dict(passed=True,dimensions=list(sheet.size),states=len(layout),frame_ms=160,
    palette_allowed=len(allowed),palette_used=len(used),colors_outside_palette=0,
    alpha_preserved_by_palette_bake=True,neutral_matches_idle=True,frame_edges_clear=True,walk_AB_distinct=True,
    gameplay_contact_review=False,game_installed=False,
    limitation='Palette mapping uses global nearest RGB, not per-material masks. Generated poses use dog references; pixel-identical joint trajectories are not guaranteed. Motion visual verdict recorded separately in qa-notes.md.')
(root/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
html='''<!doctype html><meta charset="utf-8"><title>고양이·강아지 모션 비교</title>
<style>body{background:#242832;color:#eee;font:16px sans-serif;margin:24px}main{display:flex;flex-wrap:wrap;gap:20px}.card{background:#343a46;padding:14px}canvas{background:#c5c9ce;width:256px;height:256px}button{padding:10px}</style>
<h1>고양이·강아지 모션 비교</h1><p>강아지 왼쪽 / 고양이 오른쪽 · 160ms · 걷기 A→중립→B→중립 · 게임 미설치</p>
<button id="pause">일시정지 / 재생</button><button id="step">다음 프레임</button><main></main>
<script>const layout=LAYOUT,states=STATES;let tick=0,play=true;const dog=new Image(),cat=new Image();dog.src='../dog-rgb-motion-v1/sprite-sheet-alpha.png';cat.src='sprite-sheet-alpha.png?updated='+Date.now();
const cards=states.map(s=>{let d=document.createElement('div');d.className='card';d.innerHTML='<h3>'+s+'</h3><canvas width="512" height="512"></canvas><canvas width="512" height="512"></canvas>';document.querySelector('main').append(d);return[s,...d.querySelectorAll('canvas')];});
function draw(){for(const[s,a,b]of cards){const rs=layout[s],r=rs[tick%rs.length];for(const[c,img]of[[a,dog],[b,cat]]){const x=c.getContext('2d');x.clearRect(0,0,512,512);if(img.complete)x.drawImage(img,r.x,r.y,r.w,r.h,0,0,512,512);}}}
document.querySelector('#pause').onclick=()=>play=!play;document.querySelector('#step').onclick=()=>{play=false;tick++;draw()};setInterval(()=>{if(play)tick++;draw()},160);dog.onload=cat.onload=draw;</script>'''
html=html.replace('LAYOUT',json.dumps(layout)).replace('STATES',json.dumps(states))
(root/'preview.html').write_text(html,encoding='utf-8')
print(json.dumps(report))
