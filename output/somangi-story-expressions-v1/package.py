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
with zipfile.ZipFile(P/'somangi-expression-textures.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for folder in ['textures','portraits']:
  for path in sorted((P/folder).glob('*.png')):archive.write(path,path.relative_to(P).as_posix())
 for name in ['manifest.json','expression-sheet.png','README.md']:archive.write(P/name,name)
with zipfile.ZipFile(P/'somangi-expression-models.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for path in sorted((P/'models').glob('*.glb')):archive.write(path,path.relative_to(P).as_posix())
 for name in ['manifest.json','README.md']:archive.write(P/name,name)
