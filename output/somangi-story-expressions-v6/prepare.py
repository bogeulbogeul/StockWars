from pathlib import Path
import json,shutil
P=Path(__file__).resolve().parent;source=P.parent/'somangi-story-expressions-v5'
data=json.loads((source/'manifest.json').read_text(encoding='utf-8'))
data['eyeSizePolicy']='Keep the accepted eye sizes. Only teary is matched to the original smile eyes.'
for folder,suffix in [('textures','.png'),('portraits','.png'),('models','.glb')]:
 (P/folder).mkdir(parents=True,exist_ok=True)
 for entry in data['expressions']:shutil.copy2(source/folder/(entry['id']+suffix),P/folder/(entry['id']+suffix))
(P/'manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
