import json
import shutil
from pathlib import Path
import build

root=Path(__file__).parent
record=json.loads((root/'generation.json').read_text(encoding='utf-8'))
(root/'raw').mkdir(exist_ok=True)
shutil.copy2(record['source'],root/'raw/shoulder.png')
p=build.getparts('shoulder',1)[0]
im=build.saveframe('right_walk',2,p,340/p.height)
im.save(root/'before-palette.png')
