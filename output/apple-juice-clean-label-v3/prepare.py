"""Editable vector label and matching high-resolution, antialiased print texture."""
from PIL import Image,ImageDraw
from pathlib import Path
import math
OUT=Path(__file__).resolve().parent
S=2;im=Image.new('RGBA',(1024*S,1536*S),(0,0,0,0));draw=ImageDraw.Draw(im)
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">']
def path(commands,fill,stroke=None,width=1):
    pts=[];p=(0,0);text=[]
    for cmd in commands:
        op,*v=cmd;text.append(op+' '.join(map(str,v)))
        if op=='M':p=tuple(v);pts.append(p)
        elif op=='L':p=tuple(v);pts.append(p)
        elif op=='C':
            a=p;b=tuple(v[:2]);c=tuple(v[2:4]);d=tuple(v[4:]);
            for i in range(1,41):
                t=i/40;u=1-t;pts.append((u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0],u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1]))
            p=d
    xy=[(round(x*S),round(y*S)) for x,y in pts]
    if fill:draw.polygon(xy,fill=fill)
    if stroke:draw.line(xy+[xy[0]] if commands[-1][0]=='Z' else xy,fill=stroke,width=width*S,joint='curve')
    svg.append('<path d="'+' '.join(text)+'" fill="'+(fill or 'none')+'"'+(f' stroke="{stroke}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"' if stroke else '')+'/>')
draw.rounded_rectangle((0,0,2047,3071),radius=240,fill='#fff3d9')
svg.append('<rect width="1024" height="1536" rx="120" fill="#fff3d9"/>')
for inset,stroke,w in [(28,'#e5c68c',5),(48,'#f3dfb8',3)]:
    draw.rounded_rectangle((inset*S,inset*S,(1024-inset)*S,(1536-inset)*S),radius=(120-inset//2)*S,outline=stroke,width=w*S)
    svg.append(f'<rect x="{inset}" y="{inset}" width="{1024-2*inset}" height="{1536-2*inset}" rx="{120-inset//2}" fill="none" stroke="{stroke}" stroke-width="{w}"/>')
path([('M',509,437),('C',412,357,236,404,209,540),('C',171,713,293,943,416,960),('C',464,969,483,950,512,952),('C',546,950,573,972,620,956),('C',759,911,861,682,815,533),('C',780,413,634,367,539,434),('C',528,441,519,443,509,437),('Z',)],'#e65b4b','#b94134',13)
path([('M',740,474),('C',795,644,707,868,591,915),('C',694,902,811,690,791,563),('C',782,519,763,488,740,474),('Z',)],'#d94d40')
path([('M',512,438),('C',504,369,494,329,471,296),('C',455,276,436,282,443,305),('C',468,350,477,397,476,441),('Z',)],'#53743b')
path([('M',505,349),('C',526,256,616,227,700,254),('C',686,344,607,395,505,349),('Z',)],'#7f9f4f','#4f7438',8)
path([('M',524,345),('C',574,330,624,298,669,269)],None,'#597d3c',6)
path([('M',280,535),('C',293,493,330,472,352,489),('C',373,513,339,554,317,567),('C',296,577,274,559,280,535),('Z',)],'#fff2d9')
# Bottom sprigs are mirrored with controlled leaf size and spacing.
for sign in [-1,1]:
    def xy(x,y):return (512+sign*x,y)
    a=xy(28,1365);b=xy(240,1110)
    path([('M',*a),('C',*xy(135,1310),*xy(223,1230),*b)],None,'#7b9853',10)
    for x,y in [(94,1321),(158,1262),(210,1195)]:
        path([('M',*xy(x,y)),('C',*xy(x-72,y-16),*xy(x-78,y-78),*xy(x-43,y-84)),('C',*xy(x-3,y-70),*xy(x+5,y-27),*xy(x,y)),('Z',)],'#90aa62')
        path([('M',*xy(x+7,y-11)),('C',*xy(x+71,y-10),*xy(x+83,y-65),*xy(x+59,y-79)),('C',*xy(x+22,y-78),*xy(x+4,y-41),*xy(x+7,y-11)),('Z',)],'#90aa62')
svg.append('</svg>');(OUT/'apple-label.svg').write_text('\n'.join(svg),encoding='utf8')
im.resize((1024,1536),Image.Resampling.LANCZOS).save(OUT/'apple-label.png')
