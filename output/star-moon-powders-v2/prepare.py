from PIL import Image,ImageDraw
from pathlib import Path
import math
OUT=Path(__file__).resolve().parent;S=2
for kind in ['star','moon']:
    base='#edc77e' if kind=='star' else '#ac86cb';ink='#dda03b' if kind=='star' else '#fff1d9'
    im=Image.new('RGB',(1024*S,1400*S),base);d=ImageDraw.Draw(im)
    svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1400" viewBox="0 0 1024 1400"><rect width="1024" height="1400" fill="{base}"/>']
    def rect(box,fill,outline=None,width=1):
        d.rectangle(tuple(round(v*S) for v in box),fill=fill,outline=outline,width=width*S)
        a,b,c,e=box;svg.append(f'<rect x="{a}" y="{b}" width="{c-a}" height="{e-b}" fill="{fill or "none"}"'+(f' stroke="{outline}" stroke-width="{width}"' if outline else '')+'/>')
    def path(points,fill,outline=None,width=1):
        points=[(512+(x-512)*.87,y) for x,y in points];xy=[(round(x*S),round(y*S)) for x,y in points]
        if fill:d.polygon(xy,fill=fill)
        if outline:d.line(xy+[xy[0]],fill=outline,width=width*S,joint='curve')
        svg.append('<polygon points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in points)+f'" fill="{fill or "none"}"'+(f' stroke="{outline}" stroke-width="{width}"' if outline else '')+'/>')
    def ellipse(box,fill):
        a,b,c,e=box;a=512+(a-512)*.87;c=512+(c-512)*.87
        d.ellipse((round(a*S),round(b*S),round(c*S),round(e*S)),fill=fill)
        svg.append(f'<ellipse cx="{(a+c)/2}" cy="{(b+e)/2}" rx="{(c-a)/2}" ry="{(e-b)/2}" fill="{fill}"/>')
    if kind=='star':
        rect((76,280,948,1170),'#fff0cb');rect((102,303,922,1146),None,'#e8c77e',7)
    else:rect((76,280,948,1170),None,'#d8bbdf',6)
    rect((0,198,1024,270),'#fff0d5');rect((0,1198,1024,1223),'#fff0d5')
    for x in range(120,930,100):ellipse((x-11,223,x+11,245),'#dfaf59' if kind=='star' else '#c59dd7')
    if kind=='star':
        # Concave four-point star, softly bowed rather than a flat diamond.
        pts=[];controls=[((512,360),(532,588),(545,621),(746,664)),((746,664),(553,691),(535,721),(512,950)),((512,950),(489,721),(471,691),(278,664)),((278,664),(479,621),(492,588),(512,360))]
        for a,b,c,e in controls:
            for k in range(41):
                t=k/40;u=1-t;pts.append((u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*e[0],u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*e[1]))
        path(pts,'#ffc85b','#da972b',7)
        path([(512,404),(512,665),(714,664),(534,684),(512,905),(491,684),(311,664),(491,644)],'#ffda83')
    else:
        R=205;r=195;dx=110;x=(R*R-r*r+dx*dx)/(2*dx);y=math.sqrt(R*R-x*x);a=math.atan2(y,x);b=math.atan2(-y,x-dx)
        pts=[]
        for k in range(81):
            t=a+(math.tau-2*a)*k/80;pts.append((512+R*math.cos(t),666-R*math.sin(t)))
        for k in range(81):
            t=b+(-math.tau-2*b)*k/80;pts.append((512+dx+r*math.cos(t),666-r*math.sin(t)))
        path(pts,ink)
        path([(512,942),(526,975),(559,988),(526,1001),(512,1034),(498,1001),(465,988),(498,975)],ink)
    for sign in [-1,1]:
        def xy(x,y):return (512+sign*x,y)
        # Flat printed sprigs, grouped below the emblem rather than raised badges.
        stem=[xy(120,1110),xy(235,1006),xy(278,922)]
        transformed=[(512+(x-512)*.87,y) for x,y in stem]
        d.line([(round(x*S),round(y*S)) for x,y in transformed],fill=ink,width=9*S,joint='curve')
        svg.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in transformed)+f'" fill="none" stroke="{ink}" stroke-width="9"/>')
        for x,y in [(177,1060),(225,1008),(259,948)]:
            for side in [-1,1]:
                bx,by=xy(x,y);tx,ty=xy(x+side*38,y-56);vx,vy=tx-bx,ty-by;n=math.hypot(vx,vy);pts=[]
                for s,steps in [(1,range(31)),(-1,range(30,-1,-1))]:
                    for k in steps:
                        t=k/30;w=15*math.sin(math.pi*t);pts.append((bx+vx*t-s*vy/n*w,by+vy*t+s*vx/n*w))
                path(pts,ink)
    svg.append('</svg>');(OUT/f'{kind}-front.svg').write_text('\n'.join(svg),encoding='utf8');im.resize((1024,1400),Image.Resampling.LANCZOS).save(OUT/f'{kind}-front.png')
