import json,shutil
from prepare import HERE
for j in json.loads((HERE/'generation.json').read_text(encoding='utf-8')):shutil.copy2(j['source'],HERE/j['cid']/'native-edit.png')
