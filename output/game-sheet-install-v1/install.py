import hashlib,json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
IDS=['dog','cat','red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit']
checks=[]
for cid in IDS:
 src=ROOT/'output/style-unification-v3'/cid/'run'
 asset=ROOT/'web/assets/characters'/('dog-npc-v2' if cid=='dog' else 'black-cat-npc-v2' if cid=='cat' else 'forest-friends/'+cid)
 asset.mkdir(parents=True,exist_ok=True)
 for name,target in [('sprite-sheet-alpha.png','atlas.png'),('manifest.json','manifest.json')]:shutil.copy2(src/name,asset/target)
 assert (src/'sprite-sheet-alpha.png').read_bytes()==(asset/'atlas.png').read_bytes()
 if cid=='european-rabbit':assert (asset/'atlas.png').read_bytes()==(ROOT/'output/rabbit-rear-locked-v1/run/sprite-sheet-alpha.png').read_bytes()
 elif cid=='european-badger' and (ROOT/'output/all-eight-consistency-v1/installation.json').exists():assert (asset/'atlas.png').read_bytes()==(ROOT/'output/all-eight-consistency-v1/european-badger/run/sprite-sheet-alpha.png').read_bytes()
 elif cid=='european-badger' and (ROOT/'output/badger-color-lock-v2/installation.json').exists():assert (asset/'atlas.png').read_bytes()==(ROOT/'output/badger-color-lock-v2/run/sprite-sheet-alpha.png').read_bytes()
 elif cid=='european-badger' and (ROOT/'output/badger-walk-fix-v1/installation.json').exists():assert (asset/'atlas.png').read_bytes()==(ROOT/'output/badger-walk-fix-v1/run/sprite-sheet-alpha.png').read_bytes()
 else:assert (asset/'atlas.png').read_bytes()==(ROOT/'output/dog-motion-match-v1'/cid/'before/sprite-sheet-alpha.png').read_bytes()
 checks.append({'id':cid,'asset':str(asset.relative_to(ROOT)),'approved_png_byte_identical':True,'sha256':hashlib.sha256((asset/'atlas.png').read_bytes()).hexdigest()})
(HERE/'verification.json').write_text(json.dumps({'ok':True,'checks':checks,'recolor_or_regeneration':False,'runtime_contact_visual_QA':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Installed all eight approved atlases byte-identically, including latest rear-only rabbit.')
