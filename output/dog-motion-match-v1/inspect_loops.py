import json,subprocess,sys,zipfile
from prepare import HERE,IDS,STATES
reports=[]
for cid in IDS[1:]:
 for state in STATES:
  qa=HERE/cid/'run/qa';out=qa/(state+'-motion.json')
  order=[0,1,2,1] if state.endswith('walk') else [0,1,2,3]
  descriptor=qa/(state+'-sequence.json')
  descriptor.write_text(json.dumps({'kind':'sprite-gen-asset','version':1,'frames':[{'file':f'../frames/{state}/frame-{i}.png','duration':.16} for i in order]}))
  subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect-motion','--source',str(descriptor),'--out',str(out)],check=True,stdout=subprocess.DEVNULL)
  report=json.loads(out.read_text());assert report['frame_count']==4
  assert all(abs(d-.16)<1e-6 for d in report['sequence']['durations_seconds'])
  reports.append({'id':cid,'state':state,'duration_seconds':report['duration_seconds'],'stride_verified':report['stride_verified'],'status':report['status']})
(HERE/'motion-inspection.json').write_text(json.dumps({'reports':reports,'note':'Actual four-step GIF loops at 160ms. No manually declared same-foot contact; physical stride remains unverified.'},indent=2)+'\n')
for cid in IDS[1:]:
 notes=HERE/cid/'run/qa-notes.md'
 notes.write_text('\n'.join(f'{s}: experimental / needs-review. Complete pose boards inspected for anatomy, identity and seam artifacts. Four-step loop and 160ms files verified. Live animated visual playback and in-game ground-contact QA remain unverified.' for s in STATES)+'\n',encoding='utf-8')
with zipfile.ZipFile(HERE/'dog-motion-matched-7.zip','a',zipfile.ZIP_DEFLATED) as z:
 for n in ['motion-inspection.json','preview-verification.json']:z.write(HERE/n,n)
 for cid in IDS[1:]:
  z.write(HERE/cid/'run/qa-notes.md',f'{cid}/qa-notes.md')
  for pattern in ['*-motion.json','*-sequence.json']:
   for p in (HERE/cid/'run/qa').glob(pattern):z.write(p,f'{cid}/qa/{p.name}')
print('Inspected 28 actual four-step loops at 160ms; physical stride explicitly unverified.')
