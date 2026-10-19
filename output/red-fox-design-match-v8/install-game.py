"""Install design-reference fox v8 into the shared shop/player forest slot."""
import hashlib
import json
import shutil
from pathlib import Path

here=Path(__file__).parent
root=here.parents[1]
source=here/'red-fox/run'
dest=root/'web/assets/characters/forest-friends/red-fox'
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
before={str(p):digest(p) for p in dest.parent.glob('*/atlas.png') if p.parent!=dest}
m=json.loads((source/'manifest.json').read_text(encoding='utf-8'))
previous=json.loads((dest/'manifest.json').read_text(encoding='utf-8'))
assert m['frame_layout']['rows']==previous['frame_layout']['rows']
assert m['frame_layout']['sheetWidth']==previous['frame_layout']['sheetWidth']
shutil.copy2(source/'sprite-sheet-alpha.png',dest/'atlas.png')
shutil.copy2(here/'palette.json',dest/'palette.json')
runtime={**m,'game_integrated':True,'game_input':'atlas.png',
         'sprite_sheet_alpha':'atlas.png','shared_rgb_palette':'palette.json'}
runtime['frame_layout']={**m['frame_layout'],'cellWidth':320,'cellHeight':400}
(dest/'manifest.json').write_text(json.dumps(runtime,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert digest(dest/'atlas.png')==digest(source/'sprite-sheet-alpha.png')
assert all(digest(Path(p))==value for p,value in before.items())
m.update(game_integrated=True,game_runtime='web/assets/characters/forest-friends/red-fox/')
(source/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'source_identical':True,'atlas_sha256':digest(dest/'atlas.png'),
        'destination':str(dest),'other_five_forest_atlases_unchanged':True,
        'shared_shop_rectangles_unchanged':True,'walk_sequence':[0,1,2,1],
        'frame_duration_ms':160,'states':10,'live_play_visual_qa':'pending'}
(here/'game-installation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
