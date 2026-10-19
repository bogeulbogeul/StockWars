import shutil,zipfile
from prepare import HERE,ROOT,IDS,STATES,runpath
for cid in IDS[1:]:
 run=HERE/cid/'run'
 notes=run/'qa-notes.md'
 notes.write_text('\n'.join(f'{s}: experimental / needs-review. Complete pose boards reviewed for anatomy, identity and seams. Four-step sequence at 160ms verified. Live animated playback and in-game contact QA remain unverified.' for s in STATES)+'\n',encoding='utf-8')
 dst=ROOT/'output/npc-style-animals/unified-v2/cat/run' if cid=='cat' else ROOT/'output/forest-friends/sprites-v1'/cid/'run'
 for target in [runpath(cid),dst]:
  shutil.copytree(run/'qa',target/'qa',dirs_exist_ok=True)
  shutil.copy2(notes,target/'dog-motion-qa-notes.md')
with zipfile.ZipFile(HERE/'dog-motion-matched-7.zip','a',zipfile.ZIP_DEFLATED) as z:
 existing=set(z.namelist())
 for cid in IDS[1:]:
  files=[(HERE/cid/'run/qa-notes.md',f'{cid}/qa-notes.md')]+[(p,f'{cid}/qa/{p.name}') for p in (HERE/cid/'run/qa').glob('*-sequence.json')]
  for p,name in files:
   if name not in existing:z.write(p,name)
print('Motion review limitations recorded per state; descriptor evidence included.')
