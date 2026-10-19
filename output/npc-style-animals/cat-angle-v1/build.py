import json, shutil, subprocess, sys
from pathlib import Path

HERE=Path(__file__).parent.resolve()
ROOT=HERE.parents[2]
OLD=ROOT/'output/npc-style-animals/motions-v2/cat/run'
RUN=HERE/'run'
CLI=Path(r'C:\Users\bogeu\.codex\skills\sprite-gen\.venv\Scripts\sprite-gen.exe')
RUN.mkdir(parents=True,exist_ok=True)
for name in ('frames','references'):
    shutil.copytree(OLD/name,RUN/name,dirs_exist_ok=True)
for name in ('sprite-request.json','base-source.png'):
    shutil.copy2(OLD/name,RUN/name)
(RUN/'raw').mkdir(exist_ok=True)
(RUN/'prompts').mkdir(exist_ok=True)
shutil.copy2(sys.argv[1],RUN/'raw/right_walk.png')
req=json.loads((RUN/'sprite-request.json').read_text(encoding='utf-8-sig'))
req['states']['right_walk']['action']='Exactly THREE poses A / both soles planted neutral / opposite B. Match approved dog right_walk front-right three-quarter camera, BOTH eyes visible, identical angle in all poses. Existing black cat identity and charcoal palette retained. Near arm counter-swings behind / down / forward, far arm naturally occluded. No pure profile.'
(RUN/'sprite-request.json').write_text(json.dumps(req,ensure_ascii=False,indent=2),encoding='utf-8')
def call(*args):
    p=subprocess.run([str(CLI),*args,'--run-dir',str(RUN)],capture_output=True,text=True)
    (RUN/(args[0]+'.log')).write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
    print(args[0],p.returncode,flush=True)
    if p.returncode:raise RuntimeError(p.stderr or p.stdout)
call('extract','--states','right_walk')
# Preserve canonical extraction records for the approved imported states.
fm=RUN/'frames/frames-manifest.json'
new=json.loads(fm.read_text(encoding='utf-8-sig'))
old=json.loads((OLD/'frames/frames-manifest.json').read_text(encoding='utf-8-sig'))
rows={r['state']:r for r in old['rows']}
rows.update({r['state']:r for r in new['rows']})
new['rows']=[rows[s] for s in req['states']]
new['imports']={'source':str(OLD),'unchanged_states':[s for s in req['states'] if s!='right_walk']}
fm.write_text(json.dumps(new,ensure_ascii=False,indent=2),encoding='utf-8')
call('compose-atlas')
call('preview')
call('inspect')
for s in req['states']:
    if s!='right_walk':
        for f in (OLD/'frames'/s).glob('frame-*.png'):
            assert f.read_bytes()==(RUN/'frames'/s/f.name).read_bytes()
print('All other states byte-identical',flush=True)
