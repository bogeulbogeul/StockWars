from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,zipfile
P=Path(__file__).resolve().parent;source=P.parent/'somangi-story-expressions-v5'
data=json.loads((P/'manifest.json').read_text(encoding='utf-8'));font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',27)
assert len(data['expressions'])==14
for folder,suffix in [('textures','.png'),('portraits','.png'),('models','.glb')]:
 assert len(list((P/folder).glob('*'+suffix)))==14
 for entry in data['expressions']:
  if entry['id']=='teary':continue
  name=entry['id']+suffix;assert hashlib.sha256((P/folder/name).read_bytes()).digest()==hashlib.sha256((source/folder/name).read_bytes()).digest()
sheet=Image.new('RGB',(1536,1728),(242,240,235));draw=ImageDraw.Draw(sheet)
for i,e in enumerate(data['expressions']):
 row,col=divmod(i,4);x=col*384+(384 if row==3 else 0);y=row*432
 sheet.paste(Image.open(P/'portraits'/f"{e['id']}.png").convert('RGB').resize((368,368)),(x+8,y+8));draw.text((x+192,y+378),f"{i+1:02}  {e['label']}",font=font,fill=(40,40,40),anchor='mt')
sheet.save(P/'expression-sheet.png')
comparison=Image.new('RGB',(1152,432),(242,240,235));draw=ImageDraw.Draw(comparison)
for i,(path,label) in enumerate([(source/'portraits/smile.png','기본 눈'),(source/'portraits/teary.png','이전 울먹임'),(P/'portraits/teary.png','수정 울먹임')]):
 comparison.paste(Image.open(path).convert('RGB').resize((368,368)),(i*384+8,8));draw.text((i*384+192,384),label,font=font,fill=(40,40,40),anchor='mt')
comparison.save(P/'teary-eye-comparison.png')
for name,folders in [('somangi-expression-textures.zip',['portraits','textures']),('somangi-expression-models.zip',['models'])]:
 with zipfile.ZipFile(P/name,'w',zipfile.ZIP_DEFLATED) as archive:
  for folder in folders:
   for path in sorted((P/folder).iterdir()):archive.write(path,path.relative_to(P).as_posix())
  for path in ['manifest.json','README.md','expression-sheet.png']:archive.write(P/path,path)
