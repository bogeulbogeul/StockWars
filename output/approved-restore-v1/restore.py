import hashlib,json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
IDS=['cat','red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit']
for cid in IDS:
 src=ROOT/'output/dog-motion-match-v1'/cid/'before';dst=ROOT/'output/style-unification-v3'/cid/'run';backup=HERE/'rejected-current'/cid
 if not backup.exists():shutil.copytree(dst,backup)
 for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json']:shutil.copy2(src/n,dst/n)
 shutil.copytree(src/'frames',dst/'frames',dirs_exist_ok=True)
 shutil.copy2(src/'sprite-sheet-alpha.png',dst/'native-before-palette.png')
 assert (src/'sprite-sheet-alpha.png').read_bytes()==(dst/'sprite-sheet-alpha.png').read_bytes()
print('Restored seven exact pre-motion approved PNGs; current retakes backed up separately.')
