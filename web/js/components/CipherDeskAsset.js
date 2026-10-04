import { deskCorners, deskBounds } from './CipherDesk.js';

// Vector source uses the room's measured tile intersections at the current position.
// No raster shear or unequal image scaling is needed.
export function deskAsset(item) {
    const corners=deskCorners(item),bounds=deskBounds(item);
    const r={x:bounds.x-3,y:bounds.y-3,w:bounds.w+6,h:bounds.h+6};
    const [a,b,c,d]=corners;
    const up=(p,z)=>({x:p.x-r.x,y:p.y-r.y-z});
    const face=(p,q,s,z)=>up({x:p.x+(q.x-p.x)*s,y:p.y+(q.y-p.y)*s},z);
    const parts=['<defs><linearGradient id="ivory" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff5df"/><stop offset="1" stop-color="#eddbb7"/></linearGradient><linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff8e9"/><stop offset="1" stop-color="#f6e9ce"/></linearGradient></defs>'];
    const poly=(points,fill,stroke='#082f59',width=1.5)=>parts.push(`<polygon points="${points.map(p=>`${p.x},${p.y}`).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`);
    const band=(p,q,lo,hi,fill)=>poly([up(p,hi),up(q,hi),up(q,lo),up(p,lo)],fill,fill,0);
    poly([up(b,85),up(c,85),up(c,0),up(b,0)],'#e5d1ad','#062549',2);
    poly([up(c,85),up(d,85),up(d,0),up(c,0)],'url(#ivory)','#062549',2);
    for(const [p,q] of [[b,c],[c,d]]){
        band(p,q,35,45,'#f2ba19');
        band(p,q,0,13,'#083565');
        band(p,q,72,85,'#064381');
        band(p,q,9,13,'#155ba6');
        band(p,q,81,85,'#2169b7');
        band(p,q,69,72,'#dac8a6');
        band(p,q,43,45,'#ffd65c');
    }
    // Ivory central panel and small gold company mark match the supplied desk.
    const front=(s,z)=>face(c,d,s,z);
    poly([front(.34,69),front(.66,69),front(.66,13),front(.34,13)],'url(#ivory)','#c4b698',.7);
    // Small panel seams and bevels give the same solid construction as the walls.
    for(const s of [.025,.975]){
        poly([front(s-.012,72),front(s+.012,72),front(s+.012,13),front(s-.012,13)],'#c2ac87','#c2ac87',0);
        poly([front(s+.012,72),front(s+.018,72),front(s+.018,13),front(s+.012,13)],'#fff8e8','#fff8e8',0);
    }
    const logo=(x,y)=>front(.5+(x-.5)*.18,18+y*44);
    poly([logo(0,0),logo(1,0),logo(1,1),logo(0,1)],'#0b3865','#efbc25',1.5);
    for(let i=0;i<3;i++){
        const x=.16+i*.24,h=.23+i*.17;
        poly([logo(x,.12),logo(x+.15,.12),logo(x+.15,h+.12),logo(x,h+.12)],'#f8c628','#f8c628',0);
    }
    const arrow=[logo(.12,.47),logo(.45,.67),logo(.82,.91)];
    parts.push(`<polyline points="${arrow.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="#f8c628" stroke-width="2"/>`);
    poly([logo(.82,.91),logo(.61,.85),logo(.79,.68)],'#f8c628','#f8c628',0);
    poly([up(a,85),up(b,85),up(c,85),up(d,85)],'#1258a1','#052c58',2);
    // Inset stone top leaves an actual navy rim rather than a thin outline.
    const top=(s,t)=>up({x:a.x*(1-s)*(1-t)+b.x*s*(1-t)+c.x*s*t+d.x*(1-s)*t,y:a.y*(1-s)*(1-t)+b.y*s*(1-t)+c.y*s*t+d.y*(1-s)*t},85);
    poly([top(.025,.10),top(.975,.10),top(.975,.90),top(.025,.90)],'url(#stone)','#072e58',1.2);
    parts.push(`<polyline points="${[up(b,84),up(c,84),up(d,84)].map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="#4389d0" stroke-width="1.5"/>`);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${r.w}" height="${r.h}" viewBox="0 0 ${r.w} ${r.h}">${parts.join('')}</svg>`;
    return {r,svg};
}
