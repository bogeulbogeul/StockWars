import json,shutil
from pathlib import Path
root=Path(__file__).resolve().parent
for j in json.loads((root/'generation.json').read_text(encoding='utf-8')):shutil.copy2(j['source'],root/(j['state']+'-native.png'))
