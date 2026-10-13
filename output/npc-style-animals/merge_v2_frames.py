import json,shutil
from pathlib import Path
root=Path(__file__).parent
for species in ['dog','cat']:
 old=root/'motions-v1'/species/'run'
 run=root/'motions-v2'/species/'run'
 changed={'right_walk'}|({'up_idle','up_walk'} if species=='cat' else set())
 original=json.loads((old/'frames/frames-manifest.json').read_text(encoding='utf-8'))
 new=json.loads((run/'frames/frames-manifest.json').read_text(encoding='utf-8'))
 rows={r['state']:r for r in original['rows'] if r['state'] not in changed}
 rows.update({r['state']:r for r in new['rows'] if r['state'] in changed})
 for state in rows:
  if state not in changed:shutil.copytree(old/'frames'/state,run/'frames'/state,dirs_exist_ok=True)
 new['rows']=[rows[s] for s in json.loads((run/'sprite-request.json').read_text(encoding='utf-8'))['states']]
 new['reused_verified_rows']=[s for s in rows if s not in changed]
 (run/'frames/frames-manifest.json').write_text(json.dumps(new,indent=2),encoding='utf-8')
