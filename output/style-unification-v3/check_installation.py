import json
from PIL import Image
from prepare import HERE,ROOT,IDS,runpath
from process import write
checks=[]
for cid in IDS:
 src=HERE/cid/'run';dst=runpath(cid)
 assert Image.open(src/'sprite-sheet-alpha.png').tobytes()==Image.open(dst/'sprite-sheet-alpha.png').tobytes()
 for p in (src/'frames').rglob('frame-*.png'):assert p.read_bytes()==(dst/'frames'/p.relative_to(src/'frames')).read_bytes()
 if cid in ['dog','cat']:
  game=ROOT/'web/assets/characters'/('dog-npc-v2' if cid=='dog' else 'black-cat-npc-v2')
  assert (game/'atlas.png').read_bytes()==(src/'sprite-sheet-alpha.png').read_bytes()
  assert json.loads((game/'manifest.json').read_text())['frame_layout']==json.loads((src/'manifest.json').read_text())['frame_layout']
 checks.append({'id':cid,'current_run_png_and_frames_identical':True,'game_png_identical':True if cid in ['dog','cat'] else 'not integrated'})
write(HERE/'installed-verification.json',{'ok':True,'checks':checks})
print('All 8 installed asset runs match reviewed PNGs and frames; dog/cat game atlases match.')
