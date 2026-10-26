"""Unretouched crops from the unchanged full-model reference camera."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent
render=Image.open(ROOT/'front-right.png').convert('RGB')
sheet=Image.new('RGB',(794,276),'#eeeeee');draw=ImageDraw.Draw(sheet)
draw.text((8,7),'GABLE / BEAM',fill='#222222');draw.text((534,7),'RIGHT CORNER',fill='#222222')
sheet.paste(render.crop((312,290,818,542)),(0,24))
sheet.paste(render.crop((655,435,923,647)),(526,24))
sheet.save(ROOT/'same-view-details.png')
