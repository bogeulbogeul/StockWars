from PIL import Image,ImageDraw
from pathlib import Path
import math
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1];S=2
src=Image.open(ROOT/'web/assets/items/packing-v1/items.png').convert('RGBA');src.crop((10,490,420,725)).save(OUT/'reference.png')
im=Image.new('RGB',(1536*S,704*S),'#99ad64');d=ImageDraw.Draw(im)
d.rectangle((0,142*S,1536*S,636*S),fill='#fff1cb')
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="704" viewBox="0 0 1536 704"><rect width="1536" height="704" fill="#99ad64"/><rect y="142" width="1536" height="494" fill="#fff1cb"/>']
def ellipse(box,fill,stroke=None,width=1):
    d.ellipse(tuple(int(v*S) for v in box),fill=fill,outline=stroke,width=width*S)
    a,b,c,e=box;svg.append(f'<ellipse cx="{(a+c)/2}" cy="{(b+e)/2}" rx="{(c-a)/2}" ry="{(e-b)/2}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{width}"' if stroke else '')+'/>')
def line(pts,color,width):
    d.line([(round(x*S),round(y*S)) for x,y in pts],fill=color,width=width*S,joint='curve');svg.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in pts)+f'" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>')
def leaf(base,tip,width,color,outline=None):
    dx=tip[0]-base[0];dy=tip[1]-base[1];n=math.hypot(dx,dy);nx=-dy/n;ny=dx/n;pts=[]
    for sign,steps in [(1,range(41)),(-1,range(40,-1,-1))]:
        for k in steps:
            t=k/40;w=width*math.sin(math.pi*t);pts.append((base[0]+dx*t+sign*nx*w,base[1]+dy*t+sign*ny*w))
    xy=[(round(x*S),round(y*S)) for x,y in pts];d.polygon(xy,fill=color)
    if outline:d.line(xy+[xy[0]],fill=outline,width=6*S,joint='curve')
    svg.append('<polygon points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in pts)+f'" fill="{color}"'+(f' stroke="{outline}" stroke-width="6"' if outline else '')+'/>')
ellipse((507,102,1029,680),'#fff4d5','#d6ce96',15)
ellipse((533,129,1003,654),'#fff4d5','#e6dfb7',4)
line([(712,558),(755,463),(770,345),(785,223)],'#638343',13)
leaf((763,388),(780,205),45,'#8eaa59','#58783e');line([(766,370),(780,235)],'#638343',5)
leaf((752,465),(655,355),31,'#8eaa59','#58783e');line([(749,454),(673,375)],'#638343',4)
leaf((749,467),(875,340),40,'#8eaa59','#58783e');line([(763,454),(851,366)],'#638343',4)
for x,sign in [(210,1),(1326,-1)]:
    line([(x-70*sign,527),(x+16*sign,423),(x+52*sign,306)],'#8da05d',10)
    for base,tip,w in [((x-35*sign,483),(x-96*sign,428),19),((x-10*sign,451),(x+61*sign,399),22),((x+12*sign,412),(x-22*sign,342),21),((x+38*sign,355),(x+73*sign,282),20)]:leaf(base,tip,w,'#8da05d')
for x,y in [(83,260),(397,360),(1067,460),(1435,550),(409,570),(1125,225)]:
    pts=[(x,y-16),(x+16,y),(x,y+16),(x-16,y)];d.polygon([(a*S,b*S) for a,b in pts],fill='#e5dfaa')
svg.append('</svg>');(OUT/'herb-front.svg').write_text('\n'.join(svg),encoding='utf8')
im.resize((1536,704),Image.Resampling.LANCZOS).save(OUT/'print-front.png')
side=Image.new('RGB',(512,704),'#99ad64');sd=ImageDraw.Draw(side);sd.rectangle((0,142,512,636),fill='#fff1cb')
for x,y in [(150,300),(350,460)]:sd.ellipse((x-22,y-44,x+22,y+44),fill='#8da05d')
side.save(OUT/'print-side.png')
lid=Image.new('RGB',(768,768),'#fff4d5');ld=ImageDraw.Draw(lid)
for i in range(6):
    a=math.tau*i/6;x=384+math.cos(a)*24;y=350+math.sin(a)*69;ld.ellipse((x-21,y-60,x+21,y+60),fill='#6d8845')
ld.ellipse((373,319,395,381),fill='#9faf68');lid.save(OUT/'print-lid.png')
