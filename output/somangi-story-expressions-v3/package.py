from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,zipfile
P=Path(__file__).resolve().parent
data=json.loads((P/'manifest.json').read_text(encoding='utf-8'))
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',27)
small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
sheet=Image.new('RGB',(1536,1728),(242,240,235));draw=ImageDraw.Draw(sheet)
for i,entry in enumerate(data['expressions']):
 x=(i%4)*384;y=(i//4)*432
 picture=Image.open(P/'portraits'/f"{entry['id']}.png").convert('RGB').resize((368,368))
 sheet.paste(picture,(x+8,y+8))
 text=f"{i+1:02}  {entry['label']}";draw.text((x+192,y+378),text,font=font,fill=(40,40,40),anchor='mt')
sheet.save(P/'expression-sheet.png')
comparison=Image.new('RGB',(1152,432),(242,240,235));d=ImageDraw.Draw(comparison)
for i,(key,label) in enumerate([('happy','정리한 웃는 눈'),('proud','뿌듯함 · 해냈다'),('shy','쑥스러움 · 칭찬받음')]):
 comparison.paste(Image.open(P/'portraits'/f'{key}.png').convert('RGB').resize((368,368)),(i*384+8,8))
 d.text((i*384+192,384),label,font=font,fill=(40,40,40),anchor='mt')
comparison.save(P/'smiling-eye-comparison.png')
cleanup=Image.new('RGB',(768,432),(242,240,235));d=ImageDraw.Draw(cleanup)
for i,(path,label) in enumerate([(P.parent/'somangi-story-expressions-v2/portraits/happy.png','수정 전'),(P/'portraits/happy.png','수정 후')]):
 cleanup.paste(Image.open(path).convert('RGB').resize((368,368)),(i*384+8,8));d.text((i*384+192,384),label,font=font,fill=(40,40,40),anchor='mt')
cleanup.save(P/'smiling-eye-cleanup.png')
with zipfile.ZipFile(P/'somangi-expression-textures.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for folder in ['textures','portraits']:
  for path in sorted((P/folder).glob('*.png')):archive.write(path,path.relative_to(P).as_posix())
 for name in ['manifest.json','expression-sheet.png','README.md']:archive.write(P/name,name)
with zipfile.ZipFile(P/'somangi-expression-models.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for path in sorted((P/'models').glob('*.glb')):archive.write(path,path.relative_to(P).as_posix())
 for name in ['manifest.json','README.md']:archive.write(P/name,name)
