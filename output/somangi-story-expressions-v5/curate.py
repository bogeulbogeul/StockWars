from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,shutil,zipfile,hashlib
P=Path(__file__).resolve().parent;source=P.parent/'somangi-story-expressions-v4'
data=json.loads((source/'manifest.json').read_text(encoding='utf-8'))
data['expressions']=[entry for entry in data['expressions'] if entry['id'] not in {'sad','proud'}]
data['expressionCount']=14;data['removedExpressions']=['sad','proud']
assert len(data['expressions'])==14
for folder,suffix in [('textures','.png'),('portraits','.png'),('models','.glb')]:
 (P/folder).mkdir(parents=True,exist_ok=True)
 for entry in data['expressions']:
  name=entry['id']+suffix;shutil.copy2(source/folder/name,P/folder/name)
  assert hashlib.sha256((source/folder/name).read_bytes()).digest()==hashlib.sha256((P/folder/name).read_bytes()).digest()
(P/'manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',27)
sheet=Image.new('RGB',(1536,1728),(242,240,235));draw=ImageDraw.Draw(sheet)
for i,entry in enumerate(data['expressions']):
 row,col=divmod(i,4);offset=384 if row==3 else 0;x=col*384+offset;y=row*432
 sheet.paste(Image.open(P/'portraits'/f"{entry['id']}.png").convert('RGB').resize((368,368)),(x+8,y+8))
 draw.text((x+192,y+378),f"{i+1:02}  {entry['label']}",font=font,fill=(40,40,40),anchor='mt')
sheet.save(P/'expression-sheet.png')
for archive_name,folders in [('somangi-expression-textures.zip',['textures','portraits']),('somangi-expression-models.zip',['models'])]:
 with zipfile.ZipFile(P/archive_name,'w',zipfile.ZIP_DEFLATED) as archive:
  for folder in folders:
   for path in sorted((P/folder).iterdir()):archive.write(path,path.relative_to(P).as_posix())
  for name in ['manifest.json','expression-sheet.png','README.md']:archive.write(P/name,name)
 with zipfile.ZipFile(P/archive_name) as archive:
  assert not any(Path(n).stem in {'sad','proud'} for n in archive.namelist())
(P/'verification.json').write_text(json.dumps(dict(expressionCount=14,removedFromCurrentSet=['sad','proud'],remainingAssetHashesUnchanged=True,models=14,textures=14,portraits=14),indent=2))
