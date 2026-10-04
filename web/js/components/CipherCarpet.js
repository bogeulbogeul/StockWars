import {cipherGridToScreen} from './CipherGrid.js';
export function carpetCorners(i){return [[i.u,i.v+2],[i.u,i.v],[i.u+1,i.v],[i.u+1,i.v+2]].map(([u,v])=>cipherGridToScreen(u,v));}
export function carpetBounds(i){const p=carpetCorners(i),xs=p.map(p=>p.x),ys=p.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
export function drawCarpet(ctx,image,i){
    if(!image?.naturalWidth)return;
    const vertices=carpetCorners(i);
    const outline=(inset)=>[[i.u+inset,i.v+2-inset],[i.u+inset,i.v+inset],[i.u+1-inset,i.v+inset],[i.u+1-inset,i.v+2-inset]].map(([u,v])=>cipherGridToScreen(u,v));
    const path=points=>{ctx.beginPath();points.forEach((p,n)=>n?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
    ctx.save();
    path(vertices);ctx.fillStyle='#063365';ctx.fill();
    // All border lines are constructed on the same axes as the tile grid.
    path(outline(.018));ctx.strokeStyle='#061f40';ctx.lineWidth=1;ctx.stroke();
    for(const inset of [.065,.105]){path(outline(inset));ctx.strokeStyle='#efbc2e';ctx.lineWidth=1.2;ctx.stroke();}
    path(outline(.12));ctx.fillStyle='#072b56';ctx.fill();
    const center=cipherGridToScreen(i.u+.5,i.v+1);
    // Reuse the selected image's logo without shearing or changing its proportions.
    const scale=.58;
    ctx.drawImage(image,181,104,35,43,center.x-35*scale/2,center.y-43*scale/2,35*scale,43*scale);
    ctx.restore();
}
export function carpetContains(i,p){const vertices=carpetCorners(i);let sign=0;for(let n=0;n<4;n++){const a=vertices[n],b=vertices[(n+1)%4],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);if(Math.abs(cross)<.001)continue;const s=Math.sign(cross);if(sign&&s!==sign)return false;sign=s;}return true;}


