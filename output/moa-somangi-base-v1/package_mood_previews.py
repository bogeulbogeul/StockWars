"""Package existing GLB-rendered frames at each animation's authored speed."""
import json
from pathlib import Path
from PIL import Image

P = Path(__file__).resolve().parent
moods = json.loads((P/'leaf-moods.json').read_text())['moods']
for name in ('calm', 'sad', 'curious', 'surprised'):
    files = sorted((P/(name+'-frames')).glob('*.png'))
    assert len(files) == 16, (name, len(files))
    frames = [Image.open(f).convert('RGB') for f in files]
    total_ticks = round(moods[name]['seconds']*100)
    durations = [10*(round((i+1)*total_ticks/16)-round(i*total_ticks/16)) for i in range(16)]
    frames[0].save(P/('leaf-'+name+'.gif'), save_all=True,
                   append_images=frames[1:], duration=durations, loop=0)
    print(name, sum(durations), 'ms')
