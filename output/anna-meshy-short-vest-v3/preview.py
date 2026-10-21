from PIL import Image
from pathlib import Path
P=Path(__file__).resolve().parent
for prefix,durations in [('walk',[60,60,60,70]*3),('sit',[120,130]*12)]:
 f=[Image.open(x).convert('RGB') for x in sorted(P.glob(prefix+'-*.png'))];f[0].save(P/(prefix+'.gif'),save_all=True,append_images=f[1:],duration=durations,loop=0)
