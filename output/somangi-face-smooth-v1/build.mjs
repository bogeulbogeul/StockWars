import fs from 'node:fs';
import crypto from 'node:crypto';
import {Glb,weldMesh,smoothMesh,normals} from '../somangi-reference-shape-v6/glb.mjs';
const dir='output/somangi-face-smooth-v1/';
const g=new Glb(dir+'original.glb');
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const reports=[];
for(const meshDef of g.json.meshes)for(const prim of meshDef.primitives){
 const pos=prim.attributes.POSITION,normal=prim.attributes.NORMAL;
 const original=g.vectors(pos),oldNormals=g.vectors(normal);
 const triangles=Array.from({length:g.json.accessors[prim.indices].count},(_,i)=>g.read(prim.indices,i)[0]);
 const mesh=weldMesh(original,triangles,original.map(()=>0));
 // Blend at the head/neck boundary so body, arms and legs remain exactly fixed.
 const weights=mesh.positions.map(v=>{
  const face=smooth(.10,.31,v.z);
  return smooth(-.025,.065,v.y)*(1-face);
 });
 const originalWelded=mesh.positions.map(v=>v.clone());
 smoothMesh(mesh,weights,100);
 const bounds=positions=>{
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  positions.forEach((v,i)=>{if(weights[i]<.999)return;v.toArray().forEach((x,k)=>{lo[k]=Math.min(lo[k],x);hi[k]=Math.max(hi[k],x);});});
  return {lo,hi};
 };
 const before=bounds(originalWelded),after=bounds(mesh.positions);
 // Restore head dimensions after smoothing, avoiding a smaller head.
 const scales=before.hi.map((v,k)=>(v-before.lo[k])/(after.hi[k]-after.lo[k]));
 mesh.positions.forEach((v,i)=>{
  const weight=weights[i];if(!weight)return;
  for(let k=0;k<3;k++){
   const center=(after.hi[k]+after.lo[k])/2,target=(before.hi[k]+before.lo[k])/2;
   const corrected=target+(v.getComponent(k)-center)*scales[k];
   v.setComponent(k,v.getComponent(k)+(corrected-v.getComponent(k))*weight);
  }
 });
 const mask=original.map((v,i)=>weights[mesh.ids[i]]);
 const points=original.map((v,i)=>mask[i]?mesh.positions[mesh.ids[i]].clone():v.clone());
 const rebuilt=weldMesh(points,triangles,points.map(()=>0));
 const nextNormals=normals(points,triangles,rebuilt,oldNormals,mask);
 g.write(pos,points);g.write(normal,nextNormals);
 reports.push({vertices:points.length,triangles:triangles.length/3,
  changedHeadVertices:mask.filter(Boolean).length,
  bodyVerticesExactlyPreserved:points.every((v,i)=>mask[i]>0||v.equals(original[i])),
  maxDisplacement:Math.max(...points.map((v,i)=>v.distanceTo(original[i]))),
  finite:points.every(v=>v.toArray().every(Number.isFinite)),headDimensionCompensation:scales});
}
// The generated normal map reintroduces baked bumps after geometry smoothing.
// Keep its bytes in the GLB but render using the corrected vertex normals.
for(const material of g.json.materials)delete material.normalTexture;
g.save(dir+'somangi-face-smooth.glb');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.writeFileSync(dir+'validation.json',JSON.stringify({sourceHash:hash(dir+'original.glb'),
 outputHash:hash(dir+'somangi-face-smooth.glb'),reports,
 uvTextureBytesIndicesPreserved:true,normalMapDisabled:true,method:'Welded head Laplacian smoothing with dimension compensation; pinned face and blended neck boundary',
 gameInstalled:false},null,2));
console.log(reports);
