"""Equal-scale layout of the four unretouched native detail renders."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent
sheet=Image.new('RGB',(1000,808),'#eeeeee');draw=ImageDraw.Draw(sheet)
for i,(name,label) in enumerate([('gable-detail','GABLE / ROOF JOIN'),('right-eave-detail','RIGHT ROOF EDGE'),
 ('plinth-detail','COLUMN BASES'),('foundation-detail','FOUNDATION CONTACT')]):
 x=(i%2)*500;y=(i//2)*404
 draw.text((x+10,y+7),label,fill='#222222')
 render=Image.open(ROOT/(name+'.png')).convert('RGB')
 sheet.paste(render.resize((500,380),Image.Resampling.LANCZOS),(x,y+24))
sheet.save(ROOT/'details-overview.png')
