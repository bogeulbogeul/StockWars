import json, shutil, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).parent
CLI=Path(r'C:\Users\bogeu\.codex\skills\sprite-gen\.venv\Scripts\sprite-gen.exe')
phase='Eight chronological frames of ONE full walk cycle, not eight separate illustrations: 1 left foot forward contact, 2 left support/down with right heel lifting, 3 left support with right knee passing, 4 right foot reaching forward/up, 5 right foot forward contact, 6 right support/down with left heel lifting, 7 right support with left knee passing, 8 left foot reaching forward/up into frame 1. Both feet alternate. Opposite arm and leg counter-swing. No jumps or high knees; feet lift only slightly. Head and torso retain volume with very subtle vertical bob. Exactly two arms and two legs, stable face and fingers, one tail attached at pelvis with small following sway. Fixed camera, fixed scale, no travel across frame. No duplicate neutral stops. Last pose leads into first without repeating it.'
for animal in ('dog','cat'):
    old=ROOT/'output/npc-style-animals/motions-v2'/animal/'run'
    run=HERE/animal/'run'
    req=json.loads((old/'sprite-request.json').read_text(encoding='utf-8-sig'))
    req['character']['id']=f'{animal}-npc-smooth-v1'
    for s in ('down_walk','right_walk','up_walk','right_carry'):
        req['states'][s].update(frames=8,fps=12.5,loop=True)
        view={'down_walk':'Straight FRONT, looking toward viewer, RPG top-down character view matching reference.', 'right_walk':'Facing RIGHT, same side/three-quarter camera as supplied directional reference, never rotate toward front.', 'up_walk':'Straight BACK, no face visible, heels and rear ankles visible, toes point away.', 'right_carry':'Facing RIGHT, same three-quarter camera as carry reference. Both forearms remain extended with palms UP at constant waist height under a separate parcel, NO box drawn; omit arm counter-swing for this state.'}[s]
        req['states'][s]['action']=view+' '+phase
    req['style']+=' Preserve the exact approved reference colors across all views; no identity redesign. This eight-frame sample is requested for smoother motion comparison, not a replacement of the accepted three-pose baseline.'
    run.mkdir(parents=True,exist_ok=True)
    recipe=HERE/animal/'request.json'
    recipe.write_text(json.dumps(req,ensure_ascii=False,indent=2),encoding='utf-8')
    subprocess.run([str(CLI),'prepare','--out-dir',str(run),'--character-id',req['character']['id'],'--base-image',str(old/'frames/down_idle/frame-0.png'),'--request',str(recipe)],check=True)
    for s in req['states']:
        if s not in ('down_walk','right_walk','up_walk','right_carry'):
            shutil.copytree(old/'frames'/s,run/'frames'/s,dirs_exist_ok=True)
    (run/'qa-notes.md').write_text('Generation: native image_gen GPT subscription route; no paid API. Existing accepted frames reused for idle and seated states. New eight-frame walk/carry rows use accepted directional or carry frame as identity and prepared layout guide as geometry. Canonical sprite-gen extraction and atlas assembly follow. Experimental until motion continuity review; game assets and accepted baseline are not replaced.\n',encoding='utf-8')
print('Prepared both runs')
