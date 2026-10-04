import { deskCorners, deskBounds } from './CipherDesk.js';
import { deskTexture } from './CipherDeskTexture.js';

// Retain the supplied artwork as a texture, with surface corners on the room grid.
export function deskAsset(item){
    const [a,b,c,d]=deskCorners(item),bounds=deskBounds(item);
    const r={x:bounds.x-4,y:bounds.y-60,w:bounds.w+8,h:bounds.h+64};
    const point=(p,z=0)=>[p.x-r.x,p.y-r.y-z];
    const A=[1203,71],B=[74,551],C=[335,665],D=[1468,203];
    const BB=[72,874],CC=[325,995],DD=[1475,551];
    const parts=[];
    const triangle=(source,target,clip=source)=>{
        const [p,q,s]=source,[P,Q,S]=target;
        const ux=q[0]-p[0],uy=q[1]-p[1],vx=s[0]-p[0],vy=s[1]-p[1],det=ux*vy-uy*vx;
        const Ux=Q[0]-P[0],Uy=Q[1]-P[1],Vx=S[0]-P[0],Vy=S[1]-P[1];
        const m=[(Ux*vy-Vx*uy)/det,(Uy*vy-Vy*uy)/det,(Vx*ux-Ux*vx)/det,(Vy*ux-Uy*vx)/det];
        m.push(P[0]-m[0]*p[0]-m[2]*p[1],P[1]-m[1]*p[0]-m[3]*p[1]);
        const id=`surface${parts.length}`;
        parts.push(`<defs><clipPath id="${id}"><polygon points="${clip.map(p=>p.join(',')).join(' ')}"/></clipPath></defs><g transform="matrix(${m.join(' ')})"><image width="1536" height="1024" href="${deskTexture}" clip-path="url(#${id})"/></g>`);
    };
    const quad=(src,dst)=>{
        const id=`face${parts.length}`;
        parts.push(`<defs><clipPath id="${id}"><polygon points="${dst.map(p=>p.join(',')).join(' ')}"/></clipPath></defs><g clip-path="url(#${id})">`);
        for(const indices of [[0,1,2],[0,2,3]]){
            const source=indices.map(i=>src[i]),target=indices.map(i=>dst[i]);
            const center=source.reduce((p,q)=>[p[0]+q[0]/3,p[1]+q[1]/3],[0,0]);
            // Overlap the internal diagonal by a subpixel in game space.
            // The outer face clip keeps the silhouette and grid corners exact.
            const clip=source.map(p=>{const dx=p[0]-center[0],dy=p[1]-center[1],length=Math.hypot(dx,dy);return [p[0]+dx/length*4,p[1]+dy/length*4];});
            triangle(source,target,clip);
        }
        parts.push('</g>');
    };
    quad([B,C,CC,BB],[point(b,85),point(c,85),point(c),point(b)]);
    quad([C,D,DD,CC],[point(c,85),point(d,85),point(d),point(c)]);
    quad([A,B,C,D],[point(a,85),point(b,85),point(c,85),point(d,85)]);
    // Laptop is already centered; map its base with the countertop axes.
    triangle([A,B,C],[point(a,85),point(b,85),point(c,85)],[[625,370],[759,315],[764,270],[973,181],[981,193],[949,353],[750,439],[630,386]]);
    return {r,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${r.w}" height="${r.h}" viewBox="0 0 ${r.w} ${r.h}">${parts.join('')}</svg>`};
}
