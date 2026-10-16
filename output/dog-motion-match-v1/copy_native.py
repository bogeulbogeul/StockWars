import json,shutil
from prepare import HERE
for j in json.loads((HERE/'generation.json').read_text(encoding='utf-8-sig')):
 if j.get('error'):raise RuntimeError(j)
 shutil.copy2(j['source'],HERE/j['cid']/(j['state']+'-native.png'))
print('Copied all 28 native motion rows into workspace.')
