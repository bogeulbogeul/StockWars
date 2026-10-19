import json,shutil
from pathlib import Path
from PIL import Image
from prepare import HERE,ROOT,IDS,runpath

for cid in IDS:
 run=runpath(cid)
 out=HERE/cid/'before';out.mkdir(exist_ok=True)
 for name in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json']:
  shutil.copy2(run/name,out/name)
 shutil.copytree(run/'frames',out/'frames',dirs_exist_ok=True)
for cid,folder in [('dog','dog-npc-v2'),('cat','black-cat-npc-v2')]:
 shutil.copy2(ROOT/'web/assets/characters'/folder/'atlas.png',HERE/cid/'before/game-atlas.png')
states=['down_idle_wag','right_idle_wag','up_idle_wag','down_sit_wag','right_sit_wag','right_carry_wag']
im=Image.new('RGBA',(960,2400),(0,255,255,255))
for y,s in enumerate(states):
 for x in range(3):im.alpha_composite(Image.open(runpath('dog')/f'frames/{s}/frame-{x}.png').convert('RGBA'),(320*x,400*y))
im.convert('RGB').save(HERE/'dog/wag-edit-target.png')
(HERE/'dog/wag-layout.json').write_text(json.dumps(states),encoding='utf-8')
print('Backups saved, dog tail-motion edit board ready.')
