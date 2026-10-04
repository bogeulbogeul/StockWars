import { cipherGridToScreen } from './CipherGrid.js';
export function deskCorners(item){
    return [[item.u+1,item.v],[item.u+1,item.v+3],[item.u+2,item.v+3],[item.u+2,item.v]]
        .map(([u,v])=>cipherGridToScreen(u,v));
}
export function deskBounds(item){
    const corners=deskCorners(item),xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);
    return {x:Math.min(...xs),y:Math.min(...ys)-85,w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)+85};
}
export function drawCipherDesk(ctx,item){
    const [a,b,c,d]=deskCorners(item),height=85,top=p=>({x:p.x,y:p.y-height});
    const polygon=(points,fill,stroke='#082b49',width=2)=>{
        ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(width>0){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
    };
    polygon([top(b),top(c),c,b],'#eadfc6');
    polygon([top(c),top(d),d,c],'#fff1d8');
    // Front face coordinates share the exact base edge, translated vertically.
    const face=(s,z)=>({x:c.x+(d.x-c.x)*s,y:c.y+(d.y-c.y)*s-z});
    polygon([face(0,50),face(1,50),face(1,40),face(0,40)],'#edb52f','#edb52f',0);
    polygon([face(0,10),face(1,10),face(1,0),face(0,0)],'#154b7c');
    polygon([face(0,85),face(1,85),face(1,74),face(0,74)],'#17588c');
    // An inset company panel joins the upper and lower navy rails.
    // The gold stripe ends at the panel instead of running behind a sticker.
    polygon([face(.32,74),face(.68,74),face(.68,10),face(.32,10)],'#10395d','#10395d',0);
    for(const s of [.32,.68]){const p=face(s,72),q=face(s,12);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle='#d8a936';ctx.lineWidth=1;ctx.stroke();}
    polygon([top(a),top(b),top(c),top(d)],'#fff4df','#124b7c',6);
    const logo=(x,y)=>face(.5+(x-.5)*.22,19+y*43);
    for(let i=0;i<3;i++){const x=.17+i*.23,h=.22+i*.16;polygon([logo(x,.16),logo(x+.14,.16),logo(x+.14,h+.16),logo(x,h+.16)],'#f6c139','#f6c139',0);}
    ctx.beginPath();for(const [i,p] of [[0,logo(.14,.48)],[1,logo(.44,.67)],[2,logo(.81,.88)]])i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);ctx.strokeStyle='#f6c139';ctx.lineWidth=2;ctx.stroke();
    polygon([logo(.81,.88),logo(.62,.84),logo(.78,.70)],'#f6c139','#f6c139',0);
}
