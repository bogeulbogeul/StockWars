from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import math
OUT=Path(__file__).resolve().parent;S=2;W,H=1920,980
im=Image.new('RGB',(W*S,H*S),'#dce9b7');d=ImageDraw.Draw(im)
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="980" viewBox="0 0 1920 980"><rect width="1920" height="980" fill="#dce9b7"/>']
def line(points,color,width):
    d.line([(round(x*S),round(y*S)) for x,y in points],fill=color,width=width*S,joint='curve')
    svg.append('<polyline points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in points)+f'" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>')
def polygon(points,color):
    d.polygon([(round(x*S),round(y*S)) for x,y in points],fill=color)
    svg.append('<polygon points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in points)+f'" fill="{color}"/>')
def bez(a,b,c,e):
    return [((1-t)**3*a[0]+3*(1-t)**2*t*b[0]+3*(1-t)*t*t*c[0]+t**3*e[0],(1-t)**3*a[1]+3*(1-t)**2*t*b[1]+3*(1-t)*t*t*c[1]+t**3*e[1]) for t in [i/40 for i in range(41)]]
for x in [145,1775]:line([(x,0),(x,H)],'#92a96e',11)
for yy in [480,873]:
    for x in range(210,1730,58):
        d.rounded_rectangle((x*S,(yy-5)*S,(x+29)*S,(yy+5)*S),radius=5*S,fill='#91a66b')
        svg.append(f'<rect x="{x}" y="{yy-5}" width="29" height="10" rx="5" fill="#91a66b"/>')
heart=bez((0,0),(-80,-55),(-103,-120),(-74,-146))+bez((-74,-146),(-41,-183),(0,-177),(0,-141))+bez((0,-141),(0,-177),(41,-183),(74,-146))+bez((74,-146),(103,-120),(80,-55),(0,0))
for k in range(4):
    a=math.pi/4+k*math.pi/2;pts=[(960+1.1*(x*.68*math.cos(a)-(y-5)*math.sin(a)),245+1.1*(x*.68*math.sin(a)+(y-5)*math.cos(a))) for x,y in heart];polygon(pts,'#648548')
    line([(960+10*math.sin(a),245-10*math.cos(a)),(960+142*math.sin(a),245-142*math.cos(a))],'#819b59',4)
def leaf(base,tip,width):
    dx=tip[0]-base[0];dy=tip[1]-base[1];n=math.hypot(dx,dy);pts=[]
    for s,steps in [(1,range(31)),(-1,range(30,-1,-1))]:
        for k in steps:
            t=k/30;w=width*math.sin(math.pi*t);pts.append((base[0]+dx*t-s*dy/n*w,base[1]+dy*t+s*dx/n*w))
    polygon(pts,'#91a76a')
for x,sign in [(520,1),(1400,-1)]:
    line([(x+105*sign,402),(x-20*sign,281),(x-67*sign,150)],'#8da368',12)
    for base,tip in [((x+64*sign,360),(x+118*sign,287)),((x+27*sign,323),(x-55*sign,303)),((x-10*sign,274),(x+35*sign,197)),((x-44*sign,207),(x-83*sign,116))]:leaf(base,tip,24)
font=ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf',108*S)
for i,n in enumerate([6,12,23,28,35,42]):
    x=280+i*272;r=112;y=687
    d.ellipse(((x-r)*S,(y-r)*S,(x+r)*S,(y+r)*S),fill='#fff6da',outline='#79613d',width=8*S)
    d.text((x*S,(y-4)*S),str(n),font=font,fill='#6a512d',anchor='mm')
    svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff6da" stroke="#79613d" stroke-width="8"/><text x="{x}" y="{y}" text-anchor="middle" dominant-baseline="central" font-family="Malgun Gothic" font-size="108" font-weight="700" fill="#6a512d">{n}</text>')
svg.append('</svg>');(OUT/'lotto-front.svg').write_text('\n'.join(svg),encoding='utf8');im.resize((W,H),Image.Resampling.LANCZOS).save(OUT/'lotto-front.png')
