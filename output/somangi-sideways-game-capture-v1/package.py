from PIL import Image
from pathlib import Path
import json
import sys
P=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parent
info=json.loads((P/'capture.json').read_text())
frames=[Image.open(P/'frames'/f'{i:03}.png').convert('RGB') for i in range(len(info['frames']))]
palette=frames[0].quantize(colors=256)
frames=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
durations=[30 if i%3<2 else 40 for i in range(len(frames))]
durations[0]+=350;durations[-1]+=500
filename='reverse-stop-resume.gif' if info.get('reverse') else 'actual-town-passage.gif' if info['place'].startswith('actual TownModelScene') else 'actual-store-passage.gif'
frames[0].save(P/filename,save_all=True,append_images=frames[1:],duration=durations,loop=0,disposal=2,optimize=False)
if info['place'].startswith('actual TownModelScene'):
 slow=[60 if i%3==0 else 70 for i in range(len(frames))]
 slow[0]+=350;slow[-1]+=500
 frames[0].save(P/'actual-town-passage-half-speed.gif',save_all=True,append_images=frames[1:],duration=slow,loop=0,disposal=2,optimize=False)
indices=[0,next(i for i,f in enumerate(info['frames']) if f['state']=='sideways')+8,next(i for i in range(len(info['frames'])-1,0,-1) if info['frames'][i]['state']=='walk')]
sheet=Image.new('RGB',(1000*3,760))
for col,index in enumerate(indices):sheet.paste(Image.open(P/'frames'/f'{index:03}.png'),(1000*col,0))
sheet.save(P/'three-phases.png')
if info.get('reverse'):
 start=next(i for i,f in enumerate(info['frames']) if f.get('paused'))
 end=max(i for i,f in enumerate(info['frames']) if f.get('paused'))
 comparison=Image.new('RGB',(420*3,570))
 for col,index in enumerate([start-1,(start+end)//2,end+1]):
  comparison.paste(Image.open(P/'frames'/f'{index:03}.png').crop((80,0,500,570)),(420*col,0))
 comparison.save(P/'pause-comparison.png')
print('Saved actual game capture:',len(frames),'frames;',info['phases'])
