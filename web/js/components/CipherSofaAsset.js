import {cipherGridToScreen} from './CipherGrid.js';
import {sofaTexture} from './CipherSofaTexture.js';

export function sofaAsset(item){
    const floor=[[0,0],[0,2],[1,2],[1,0]].map(([u,v])=>cipherGridToScreen(item.u+u,item.v+v));
    const xs=floor.map(p=>p.x),ys=floor.map(p=>p.y);
    const r={x:Math.min(...xs)-2,y:Math.min(...ys)-82,w:Math.max(...xs)-Math.min(...xs)+4,h:Math.max(...ys)-Math.min(...ys)+84};
    const point=(u,v,z)=>{const p=cipherGridToScreen(item.u+u,item.v+v);return [p.x-r.x,p.y-r.y-z];};
    const parts=['<defs><linearGradient id="seat" x2="0" y2="1"><stop stop-color="#205397"/><stop offset="1" stop-color="#10356a"/></linearGradient><linearGradient id="front" x2="0" y2="1"><stop stop-color="#163d76"/><stop offset="1" stop-color="#08264d"/></linearGradient></defs>'];
    let faceId=0;
    // Rebuild each upholstered face on exact grid vertices, retaining the approved painted surfaces.
    const texture=(source,target,radius=3)=>{
        const id='upholstery'+faceId++;
        const corners=target.map((p,n)=>{const toward=q=>{const t=Math.min(radius/Math.hypot(q[0]-p[0],q[1]-p[1]),.2);return p.map((v,k)=>v+(q[k]-v)*t);};return {p,a:toward(target[(n+3)%4]),b:toward(target[(n+1)%4])};});
        const path='M'+corners[0].a.join(',')+corners.map(({p,a,b},n)=>(n?'L'+a.join(','):'')+'Q'+p.join(',')+' '+b.join(',')).join('')+'Z';
        parts.push(`<defs><clipPath id="${id}"><path d="${path}"/></clipPath></defs><g clip-path="url(#${id})">`);
        for(const indices of [[0,1,2],[0,2,3]]){
            const s=indices.map(n=>source[n]),t=indices.map(n=>target[n]);
            const [x0,y0]=s[0],dx1=s[1][0]-x0,dy1=s[1][1]-y0,dx2=s[2][0]-x0,dy2=s[2][1]-y0,det=dx1*dy2-dx2*dy1;
            const a=((t[1][0]-t[0][0])*dy2-(t[2][0]-t[0][0])*dy1)/det,c=(dx1*(t[2][0]-t[0][0])-dx2*(t[1][0]-t[0][0]))/det;
            const b=((t[1][1]-t[0][1])*dy2-(t[2][1]-t[0][1])*dy1)/det,d=(dx1*(t[2][1]-t[0][1])-dx2*(t[1][1]-t[0][1]))/det;
            const center=[s.reduce((v,p)=>v+p[0],0)/3,s.reduce((v,p)=>v+p[1],0)/3];
            const expanded=s.map(p=>{const len=Math.hypot(p[0]-center[0],p[1]-center[1]);return p.map((v,k)=>v+(v-center[k])*2/len);});
            const tri=id+'t'+indices[1];
            parts.push(`<g transform="matrix(${a} ${b} ${c} ${d} ${t[0][0]-a*x0-c*y0} ${t[0][1]-b*x0-d*y0})"><defs><clipPath id="${tri}"><polygon points="${expanded.map(p=>p.join(',')).join(' ')}"/></clipPath></defs><image href="${sofaTexture}" width="1536" height="1024" clip-path="url(#${tri})"/></g>`);
        }
        parts.push(`</g><path d="${path}" fill="none" stroke="#082449" stroke-width=".8"/>`);
    };
    const poly=(pts,fill,stroke='#061e3e',width=1.2)=>parts.push(`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`);
    const cushion=(pts,fill,stroke='#eac14b',width=1,radius=4)=>{
        const corner=pts.map((p,n)=>{const prev=pts[(n+pts.length-1)%pts.length],next=pts[(n+1)%pts.length];const toward=q=>{const len=Math.hypot(q[0]-p[0],q[1]-p[1]),t=Math.min(radius/len,.2);return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];};return {p,start:toward(prev),end:toward(next)};});
        const path=`M${corner[0].start.join(',')} `+corner.map(({p,start,end},n)=>`${n?'L'+start.join(','):''} Q${p.join(',')} ${end.join(',')}`).join(' ')+' Z';
        parts.push(`<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`);
    };
    const plane=(u0,v0,u1,v1,z,fill,stroke,width)=>poly([[u0,v0],[u0,v1],[u1,v1],[u1,v0]].map(([u,v])=>point(u,v,z)),fill,stroke,width);
    const box=(u0,v0,u1,v1,lo,hi)=>{
        poly([point(u0,v1,hi),point(u1,v1,hi),point(u1,v1,lo),point(u0,v1,lo)],'#0a2c57');
        poly([point(u1,v1,hi),point(u1,v0,hi),point(u1,v0,lo),point(u1,v1,lo)],'url(#front)');
        plane(u0,v0,u1,v1,hi,'url(#seat)');
    };
    // The feet reach the exact four footprint corners.
    for(const [u,v] of [[0,0],[0,1.86],[.86,0],[.86,1.86]]){
        box(u,v,u+.14,v+.14,0,7);
        poly([point(u+.14,v+.14,6),point(u+.14,v,6),point(u+.14,v,0),point(u+.14,v+.14,0)],'#e6b734','#aa7d24',.5);
    }
    box(0,0,1,2,7,23);
    // Two back cushions, both on the same vertical plane and floor axis.
    for(const [v0,v1] of [[.19,.98],[1.02,1.81]]){
        box(0,v0,.15,v1,23,79);
        cushion([point(.15,v1,77),point(.15,v0,77),point(.15,v0,30),point(.15,v1,30)],'url(#seat)','#ecc34b',1.1,5);
        cushion([point(.16,v1-.035,73),point(.16,v0+.035,73),point(.16,v0+.035,34),point(.16,v1-.035,34)],'#173d78','#214c8b',1,4);
        texture(v0<1?[[732,243],[1110,105],[1110,331],[743,472]]:[[327,370],[711,237],[725,463],[331,596]], [point(.15,v1,77),point(.15,v0,77),point(.15,v0,30),point(.15,v1,30)],4);
        cushion([point(.95,v1,36),point(.95,v0,36),point(.95,v0,23),point(.95,v1,23)],'url(#front)','#082449',1,3);
        cushion([[.17,v0],[.17,v1],[.95,v1],[.95,v0]].map(([u,v])=>point(u,v,36)),'url(#seat)','#edc54a',1,4);
        cushion([[.22,v0+.04],[.22,v1-.04],[.88,v1-.04],[.88,v0+.04]].map(([u,v])=>point(u,v,37)),'#1c4787','#225394',.7,3);
        texture(v0<1?[[749,476],[1113,342],[1312,460],[959,591]]:[[491,554],[731,473],[928,603],[553,724]], [point(.17,v1,36),point(.17,v0,36),point(.95,v0,36),point(.95,v1,36)],4);
    }
    // Far arm first, near arm last; gold inset follows the vertical face.
    for(const [v0,v1] of [[0,.19],[1.81,2]]){
        box(0,v0,1,v1,7,49);
        cushion([[0,v0],[0,v1],[1,v1],[1,v0]].map(([u,v])=>point(u,v,50)),'url(#seat)','#102e5b',1.2,3);
        texture(v0<1?[[1121,168],[1117,212],[1345,366],[1410,337]]:[[249,410],[173,442],[476,626],[542,601]], [point(0,v0,50),point(0,v1,50),point(1,v1,50),point(1,v0,50)],3);
        cushion([point(1,v1-.02,46),point(1,v0+.02,46),point(1,v0+.02,10),point(1,v1-.02,10)],'#0b2f5f','#e9be3d',1,2);
    }
    return {r,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${r.w}" height="${r.h}" viewBox="0 0 ${r.w} ${r.h}">${parts.join('')}</svg>`};
}
