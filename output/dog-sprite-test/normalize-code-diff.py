import subprocess,difflib
from pathlib import Path
files=['TownStage.js','OfficeStage.js','logistics/LogisticsRenderer.js','store/VivianStoreModal.js','CipherCanvasLobby.js']
for name in files:
 p=Path('web/js/components')/name
 old=subprocess.check_output(['git','show','HEAD:'+p.as_posix()]).decode('utf-8').splitlines(keepends=True)
 new=p.read_bytes().decode('utf-8').splitlines(keepends=True)
 a=[s.rstrip('\r\n') for s in old];b=[s.rstrip('\r\n') for s in new]
 result=[]
 for tag,i,j,k,l in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
  result.extend(old[i:j] if tag=='equal' else new[k:l])
 p.write_bytes(''.join(result).encode('utf-8'))
