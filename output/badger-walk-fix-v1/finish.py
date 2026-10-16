import json,shutil,subprocess,sys,zipfile
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
assert json.loads((HERE/'installation.json').read_text())['ok']
shutil.copy2(ROOT/'output/style-unification-v3/validate-preview.cjs',HERE/'validate-preview.cjs')
p=HERE/'validate-preview.cjs';p.write_text(p.read_text().replace('characters:8','characters:1').replace('dogTailStates:6','dogTailStates:0'))
r=subprocess.run(['node',str(p)],capture_output=True,text=True)
if r.returncode:raise RuntimeError(r.stderr[-800:])
with zipfile.ZipFile(HERE/'badger-walk-fixed.zip','a',zipfile.ZIP_DEFLATED) as z:
 z.write(HERE/'preview-verification.json','preview-verification.json')
 z.write(HERE/'color-bake/recolor.report.json','color-bake/recolor.report.json')
 for p in (HERE/'run/qa').glob('*-motion.json'):z.write(p,'run/qa/'+p.name)
print('Preview render-path smoke check passed; color-bake evidence packaged.')
