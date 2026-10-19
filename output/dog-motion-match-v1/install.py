import json,shutil,zipfile
from PIL import Image
from prepare import HERE,ROOT,IDS,runpath
from process import write

def destination(cid):
 return ROOT/'output/npc-style-animals/unified-v2/cat/run' if cid=='cat' else ROOT/'output/forest-friends/sprites-v1'/cid/'run'
dog_before=(HERE/'dog/before/sprite-sheet-alpha.png').read_bytes()
for cid in IDS[1:]:
 src=runpath(cid);dst=destination(cid)
 for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','registration.json','motion-verification.json']:shutil.copy2(src/n,dst/n)
 shutil.copytree(src/'frames',dst/'frames',dirs_exist_ok=True);shutil.copytree(src/'qa',dst/'qa',dirs_exist_ok=True)
 shutil.copy2(src.parent/'review-final.png',dst/'qa/style-correction-contact.png')
 notes=dst/'qa-notes.md';prior=notes.read_text(encoding='utf-8') if notes.exists() else ''
 if 'dog-motion-match-v1' not in prior:notes.write_text('2026-10-16 dog-motion-match-v1: Three walking rows and carry retaken against unchanged dog. Complete native poses; shared neutral preserved. One scale per row; registration excludes tail bounding-box motion. Three walk frames, A-neutral-B-neutral at 160ms unchanged. No head/body graft or rig. Pose boards reviewed; live in-game contact/stride QA not performed. Sources and comparison: output/dog-motion-match-v1/.\n\n'+prior,encoding='utf-8')
 # Keep delivery package run metadata/GIFs identical to reviewed current run.
 for n in ['manifest.json','sprite-request.json']:shutil.copy2(src/n,HERE/cid/'run'/n)
 shutil.copytree(src/'frames',HERE/cid/'run/frames',dirs_exist_ok=True)
 shutil.copytree(src/'qa',HERE/cid/'run/qa',dirs_exist_ok=True)
for n,out in [('sprite-sheet-alpha.png','atlas.png'),('manifest.json','manifest.json')]:shutil.copy2(runpath('cat')/n,ROOT/'web/assets/characters/black-cat-npc-v2'/out)
assert dog_before==runpath('dog').joinpath('sprite-sheet-alpha.png').read_bytes()==(ROOT/'web/assets/characters/dog-npc-v2/atlas.png').read_bytes()
write(HERE/'installation.json',{'ok':True,'updated':IDS[1:],'runtime_updated':['black-cat-npc-v2'],'dog_png_unchanged':True,'forest_runtime_integrated':False})
with zipfile.ZipFile(HERE/'dog-motion-matched-7.zip','w',zipfile.ZIP_DEFLATED) as z:
 for cid in IDS[1:]:
  run=HERE/cid/'run'
  for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','registration.json','motion-verification.json']:z.write(run/n,f'{cid}/{n}')
  for p in (run/'frames').rglob('*.png'):z.write(p,f'{cid}/'+p.relative_to(run).as_posix())
  for p in (run/'qa').glob('*.gif'):z.write(p,f'{cid}/qa/{p.name}')
 for n in ['preview.html','generation.json','verification.json','README.md']:z.write(HERE/n,n)
print('Installed 7 species and cat runtime; unchanged dog verified. Packaged seven sheets and preview.')
