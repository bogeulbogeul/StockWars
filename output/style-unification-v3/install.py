import copy,json,shutil
from pathlib import Path
from PIL import Image
from prepare import HERE,ROOT,IDS,runpath
from process import write

def main():
 assert json.loads((HERE/'verification.json').read_text())['ok']
 checks=[]
 for cid in IDS:
  src=HERE/cid/'run';dst=runpath(cid)
  old=json.loads((dst/'manifest.json').read_text());new=json.loads((src/'manifest.json').read_text())
  assert old['frame_layout']==new['frame_layout'] and old['animation']==new['animation']
  for name in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json']:shutil.copy2(src/name,dst/name)
  shutil.copytree(src/'frames',dst/'frames',dirs_exist_ok=True)
  shutil.copytree(src/'qa',dst/'qa',dirs_exist_ok=True)
  shutil.copy2(HERE/cid/'review-final.png',dst/'qa/style-correction-contact.png')
  shutil.copy2(src/'verification.json',dst/'style-correction-verification.json')
  notes=dst/'qa-notes.md';history=notes.read_text(encoding='utf-8') if notes.exists() else ''
  if 'style-unification-v3' not in history:
   notes.write_text('2026-10-16 style-unification-v3: Actual frames corrected by native image_gen against the same approved front-idle color, line and shading reference. Canonical sprite-gen chroma/component extraction; one isotropic scale per edit board; existing atlas rectangles/timing retained. Dog held tail bodies locked. No paw pads. Final continuous native RGB preserved; palette-reduction and exact-color trial bakes were rejected for eye/grain artifacts. Source, prompts, before/after and checks: output/style-unification-v3/. Forest game integration and actual furniture/cargo contact QA remain separate.\n\nPrior generation notes (history):\n'+history,encoding='utf-8')
  checks.append({'id':cid,'updated':str(dst.relative_to(ROOT)),'layout_unchanged':True})
 # Maintain the non-wag dog base sheet, still referenced as the face/identity baseline.
 base=ROOT/'output/npc-style-animals/unified-v2/dog/run';src=HERE/'dog/run'
 backup=HERE/'dog/before/unified-base';backup.mkdir(exist_ok=True)
 for name in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json']:
  if not (backup/name).exists():shutil.copy2(base/name,backup/name)
 if not (backup/'frames').exists():shutil.copytree(base/'frames',backup/'frames')
 m=json.loads((base/'manifest.json').read_text());sm=json.loads((src/'manifest.json').read_text())
 image=Image.new('RGBA',(m['frame_layout']['sheetWidth'],m['frame_layout']['sheetHeight']))
 fm=json.loads((base/'frames/frames-manifest.json').read_text());srows={r['state']:r for r in json.loads((src/'frames/frames-manifest.json').read_text())['rows']}
 fm['rows']=[copy.deepcopy(srows[r['state']]) for r in fm['rows']]
 for state,rects in m['frame_layout']['rows'].items():
  for i,r in enumerate(rects):
   file=src/f'frames/{state}/frame-{i}.png';shutil.copy2(file,base/f'frames/{state}/frame-{i}.png')
   image.paste(Image.open(file).convert('RGBA'),(r['x'],r['y']))
 m['style_correction']=sm['style_correction'];image.save(base/'sprite-sheet-alpha.png');write(base/'manifest.json',m);write(base/'frames/frames-manifest.json',fm)
 for p in (src/'qa').glob('*.gif'):
  if '_wag' not in p.name:shutil.copy2(p,base/'qa'/p.name)
 # Runtime atlases: only these two characters are already integrated.
 for cid,asset in [('dog','dog-npc-v2'),('cat','black-cat-npc-v2')]:
  src=HERE/cid/'run';dst=ROOT/'web/assets/characters'/asset
  shutil.copy2(src/'sprite-sheet-alpha.png',dst/'atlas.png');shutil.copy2(src/'manifest.json',dst/'manifest.json')
  assert Image.open(dst/'atlas.png').tobytes()==Image.open(src/'sprite-sheet-alpha.png').tobytes()
 write(HERE/'installation.json',{'ok':True,'runs':checks,'base_dog_updated':True,'runtime_updated':['dog-npc-v2','black-cat-npc-v2'],'forest_game_integrated':False})
 print('Installed eight current asset runs, dog base, and dog/cat runtime PNGs; atlas layouts unchanged.')
if __name__=='__main__':main()
