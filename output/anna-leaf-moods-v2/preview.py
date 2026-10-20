from PIL import Image
from pathlib import Path
P=Path(__file__).resolve().parent
for mood,durations in [('Calm',[160,170,170]*4),('Happy',[60,60,60,70]*3),('Sad',[160,170,170]*4)]:
 f=[Image.open(x).convert('RGB') for x in sorted(P.glob('Leaf_'+mood+'-*.png'))];f[0].save(P/(mood.lower()+'.gif'),save_all=True,append_images=f[1:],duration=durations,loop=0)
