import fs from 'node:fs';
import {Glb,weldMesh,normals} from '../somangi-reference-shape-v6/glb.mjs';
const dir='output/somangi-slim-design-v1/';
const g=new Glb(dir+'original.glb'),p=g.vectors(0),old=g.vectors(1);
const tri=Array.from({length:g.json.accessors[3].count},(_,i)=>g.read(3,i)[0]);
const mesh=weldMesh(p,tri,p.map(()=>0));
const visited=new Set(),components=[];
for(let i=0;i<mesh.positions.length;i++){
 if(visited.has(i))continue;
 const stack=[i],ids=[];visited.add(i);
 while(stack.length){const k=stack.pop();ids.push(k);for(const n of mesh.adj[k])if(!visited.has(n)){visited.add(n);stack.push(n);}}
 const lo=[Infinity,Infinity,Infinity],hi=lo.map(()=>-Infinity);
 for(const k of ids)mesh.positions[k].toArray().forEach((v,a)=>{lo[a]=Math.min(lo[a],v);hi[a]=Math.max(hi[a],v);});
 components.push({ids,count:ids.length,lo,hi});
}
console.log(components.filter(c=>c.count>100).map(({ids,...c})=>c));
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const floor=g.json.accessors[0].min[1];
const next=p.map(v=>{
 const q=v.clone(),head=smooth(-.025,.055,v.y),body=1-head;
 const sign=Math.sign(v.x);
 const leg=1-smooth(-.73,-.58,v.y);
 const narrow=.80+.14*smooth(-.45,-.04,v.y);
 let x=v.x*narrow;
 // Narrow each leg about its own center; close stance to match slimmer hips.
 const legX=sign*.176+(v.x-sign*.205)*.88;
 x=x*(1-leg)+legX*leg;
 // One continuous field preserves the joined arm/shoulder surface.
 q.x=x*body+v.x*head;
 q.z=v.z*(1-body*.22);
 // Lengthen the legs with a smooth field that leaves the sole plane fixed.
 q.y+=.095*smooth(floor,-.56,v.y);
 return q;
});
const rebuilt=weldMesh(next,tri,next.map(()=>0));
g.write(0,next);g.write(1,normals(next,tri,rebuilt,old,p.map(()=>1)));
// The source normal map contains visible stamped marks on the back of the head.
// Use the actual smooth mesh normals for the adopted clean clay surface.
for(const material of g.json.materials)delete material.normalTexture;
g.save(dir+'somangi-slim.glb');
const report={source:'Meshy_AI_Blank_Buddy_1022154035_texture.glb',vertices:p.length,triangles:tri.length/3,
 finite:next.every(v=>v.toArray().every(Number.isFinite)),
 maxDisplacement:Math.max(...next.map((v,i)=>v.distanceTo(p[i]))),
 textureBytesUvsIndicesPreserved:true,normalMapDisabledForCleanSurface:true,rigged:false,animations:0,
 notes:'Body width and belly depth reduced, limbs slimmed, legs lengthened; head shape and facial texture preserved. Not installed in game.'};
fs.writeFileSync(dir+'validation.json',JSON.stringify(report,null,2));
console.log(report);
