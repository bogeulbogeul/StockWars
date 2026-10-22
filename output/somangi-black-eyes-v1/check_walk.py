from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json
P=Path(__file__).resolve().parent
frames=[];checks=[]
for i in range(18):
    panel=Image.new('RGB',(960,560),'#eeeeee')
    draw=ImageDraw.Draw(panel)
    for col,view in enumerate(['front','angle']):
        im=Image.open(P/('walk-'+view)/f'{i:03}.png').convert('RGB')
        pixels=np.array(im);mask=(pixels.max(axis=2)<65)
        mask[:100]=False;mask[230:]=False;mask[:,:100]=False;mask[:,380:]=False
        pending=set(map(tuple,np.argwhere(mask)));components=[]
        while pending:
            seed=pending.pop();stack=[seed];component=[seed]
            while stack:
                y,x=stack.pop()
                for q in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
                    if q in pending:pending.remove(q);stack.append(q);component.append(q)
            if len(component)>20:components.append(component)
        eyes=sorted(components,key=len,reverse=True)[:2]
        assert len(eyes)==2,(view,i)
        for eye in eyes:
            region=set(eye)
            core=[(y,x) for y,x in eye if all((y+dy,x+dx) in region for dy in range(-2,3) for dx in range(-2,3))]
            assert len(core)>10
            samples=np.array([pixels[y,x] for y,x in core],dtype=float)
            median=np.median(samples,axis=0)
            checks.append({'view':view,'frame':i,'corePixels':len(core),'medianRGB':median.tolist()})
            assert max(median)<10 and max(median)-min(median)<5,(view,i,median)
        panel.paste(im,(col*480,40));draw.text((col*480+12,12),view+' / warm light',fill='black')
    frames.append(panel)
palette=frames[0].quantize(colors=256)
colors=palette.getpalette();dark=min(range(256),key=lambda i:sum(colors[i*3:i*3+3]))
colors[dark*3:dark*3+3]=[0,0,0];palette.putpalette(colors)
encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
encoded[0].save(P/'walk-black-eyes.gif',save_all=True,append_images=encoded[1:],duration=[50 if i%6==0 else 40 for i in range(18)],loop=0,optimize=False)
sheet=Image.new('RGB',(960,560*3))
for row,i in enumerate([0,6,12]):sheet.paste(frames[i],(0,row*560))
sheet.save(P/'walk-contact-sheet.png')
report={'renderedFrames':36,'eyeSamples':len(checks),'lighting':'warm RGB(1,.48,.18)','allEyeCoreMediansNearBlack':True,'maxMedianChannel':max(max(c['medianRGB']) for c in checks),'scope':'rendered eye interiors, excludes antialiased edges; not a guarantee for arbitrary renderers or lighting','checks':checks}
(P/'walk-eye-validation.json').write_text(json.dumps(report,indent=2))
print({k:v for k,v in report.items() if k!='checks'})
