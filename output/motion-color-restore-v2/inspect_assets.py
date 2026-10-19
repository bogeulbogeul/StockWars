import json,shutil,subprocess,sys,zipfile
from prepare import HERE,ROOT,IDS,current
from process import write
reports=[]
for cid in IDS:
 run=HERE/cid/'run'
 subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect','--run-dir',str(run)],check=True,stdout=subprocess.DEVNULL)
 for state in ['down_walk','right_walk','up_walk','right_carry']:
  qa=run/'qa';order=[0,1,2,1] if state.endswith('walk') else [0,1,2,3];desc=qa/(state+'-sequence.json');out=qa/(state+'-motion.json')
  write(desc,{'kind':'sprite-gen-asset','version':1,'frames':[{'file':f'../frames/{state}/frame-{i}.png','duration':.16} for i in order]})
  subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect-motion','--source',str(desc),'--out',str(out)],check=True,stdout=subprocess.DEVNULL)
  r=json.loads(out.read_text());assert r['frame_count']==4 and all(d==.16 for d in r['sequence']['durations_seconds'])
  reports.append({'id':cid,'state':state,'status':r['status'],'stride_verified':r['stride_verified']})
 dst=ROOT/'output/npc-style-animals/unified-v2/cat/run' if cid=='cat' else ROOT/'output/forest-friends/sprites-v1'/cid/'run'
 for target in [current(cid),dst]:shutil.copytree(run/'qa',target/'qa',dirs_exist_ok=True)
 print(cid,'static inspect and actual sequence checks passed',flush=True)
write(HERE/'motion-inspection.json',{'reports':reports,'note':'Four-step timing checked; no manual contact evidence. Physical stride and live continuity remain unverified.'})
with zipfile.ZipFile(HERE/'color-restored-7.zip','a',zipfile.ZIP_DEFLATED) as z:
 for n in ['motion-inspection.json','preview-verification.json']:z.write(HERE/n,n)
 for cid in IDS:
  for pattern in ['*-sequence.json','*-motion.json']:
   for p in (HERE/cid/'run/qa').glob(pattern):z.write(p,f'{cid}/run/qa/{p.name}')
