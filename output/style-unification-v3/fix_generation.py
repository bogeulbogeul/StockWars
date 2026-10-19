import json
from prepare import HERE
p=HERE/'generation.json';v=json.loads(p.read_text())
for j in v:j['source']=j['source'].split(' as ')[-1]
p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
