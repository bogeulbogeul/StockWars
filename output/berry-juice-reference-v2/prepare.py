from PIL import Image,ImageDraw
from pathlib import Path
import math
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1];S=2
source=Image.open(ROOT/'web/assets/items/packing-v1/items.png').convert('RGBA');source.crop((1665,25,1940,395)).save(OUT/'reference.png')
im=Image.new('RGBA',(1024*S,768*S),(0,0,0,0));d=ImageDraw.Draw(im)
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">']
def ellipse(box,fill,outline=None,width=1):
    x0,y0,x1,y1=box
    d.ellipse((round((512+(x0-512)*.78)*S),round(y0*S),round((512+(x1-512)*.78)*S),round(y1*S)),fill=fill,outline=outline,width=width*S)
    x0,y0,x1,y1=box;svg.append(f'<ellipse cx="{(x0+x1)/2}" cy="{(y0+y1)/2}" rx="{(x1-x0)/2}" ry="{(y1-y0)/2}" fill="{fill}"'+(f' stroke="{outline}" stroke-width="{width}"' if outline else '')+'/>')
for inset,fill,border,width in [(0,'#fff0d4',None,1),(23,None,'#e5b58b',6),(43,None,'#f3d2b2',4)]:
    box=(inset*S,inset*S,(1023-inset)*S,(767-inset)*S)
    d.rounded_rectangle(box,radius=(112-inset//2)*S,fill=fill,outline=border,width=width*S)
    svg.append(f'<rect x="{inset}" y="{inset}" width="{1024-2*inset}" height="{768-2*inset}" rx="{112-inset//2}" fill="{fill or "none"}"'+(f' stroke="{border}" stroke-width="{width}"' if border else '')+'/>')
# Three flat, crisp printed leaves. Polygon outlines use sampled cubic curves.
svg.append('<g transform="translate(512 0) scale(.78 1) translate(-512 0)">')
def leaf(a,b,c,e,ret1,ret2):
    def bez(p0,p1,p2,p3):
        return [((1-t)**3*p0[0]+3*(1-t)**2*t*p1[0]+3*(1-t)*t*t*p2[0]+t**3*p3[0],(1-t)**3*p0[1]+3*(1-t)**2*t*p1[1]+3*(1-t)*t*t*p2[1]+t**3*p3[1]) for t in [i/40 for i in range(41)]]
    pts=bez(a,b,c,e)+bez(e,ret1,ret2,a)
    points=[(int((512+(x-512)*.78)*S),int(y*S)) for x,y in pts]
    d.polygon(points,fill='#7c994e');d.line(points,fill='#4f7137',width=6*S,joint='curve')
    svg.append(f'<path d="M{a[0]} {a[1]} C{b[0]} {b[1]} {c[0]} {c[1]} {e[0]} {e[1]} C{ret1[0]} {ret1[1]} {ret2[0]} {ret2[1]} {a[0]} {a[1]}" fill="#7c994e" stroke="#4f7137" stroke-width="6"/>')
leaf((460,350),(355,345),(320,290),(325,235),(405,220),(460,275))
leaf((510,325),(455,260),(480,185),(540,155),(584,225),(571,290))
leaf((550,345),(565,255),(645,215),(705,225),(697,300),(625,357))
for x,y in [(450,350),(563,355),(395,445),(510,430),(625,445),(452,530),(565,530),(509,590)]:
    r=65
    ellipse((x-r,y-r,x+r,y+r),'#d94c70','#b73558',5)
    ellipse((x-r+12,y-r+11,x+r-12,y+r-10),'#eb6581')
    ellipse((x-30,y-35,x-9,y-14),'#ffb6bf')
svg.append('</g></svg>');(OUT/'berry-label.svg').write_text('\n'.join(svg),encoding='utf8')
im.resize((1024,768),Image.Resampling.LANCZOS).save(OUT/'berry-label.png')
