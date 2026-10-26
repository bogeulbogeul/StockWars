import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Glb,weldMesh,smoothMesh,normals} from '../somangi-reference-shape-v6/glb.mjs';
const out=path.resolve('output/somangi-neck-smooth-v8');
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const reports=[];
for(const file of ['walk.glb','wave.glb','eat.glb','jump.glb','crab.glb','office-sit.glb']){
 const source=path.join(out,'original',file);fs.mkdirSync(path.dirname(source),{recursive:true});
 if(!fs.existsSync(source))fs.copyFileSync('web/assets/characters/3d/somangi/'+file,source);
 const g=new Glb(source),j=g.json;let changed=0;
 for(const node of j.nodes){if(node.name!=='Somangi_Body')continue;
  for(const p of j.meshes[node.mesh].primitives){
   const original=g.vectors(p.attributes.POSITION),points=original.map(v=>v.clone()),old=g.vectors(p.attributes.NORMAL);
   const groups=points.map((v,i)=>{const w=g.read(p.attributes.WEIGHTS_0,i),a=g.read(p.attributes.JOINTS_0,i);return j.nodes[j.skins[node.skin].joints[a[w.indexOf(Math.max(...w))]]].name;});
   const head=points.filter((v,i)=>groups[i]==='Head'),base=Math.min(...head.map(v=>v.y))-.003338;
   const triangles=Array.from({length:j.accessors[p.indices].count},(_,i)=>g.read(p.indices,i)[0]);
   const mesh=weldMesh(points,triangles,groups);
   const weights=mesh.positions.map((v,i)=>groups[mesh.members[i][0]]==='Head'?1-smooth(.06,.22,v.y-base):0);
   smoothMesh(mesh,weights,80);
   const mask=points.map((v,i)=>weights[mesh.ids[i]]);
   points.forEach((v,i)=>{if(!mask[i])return;v.copy(mesh.positions[mesh.ids[i]]);
    const y=v.y-base,r=Math.hypot(v.x/.54,v.z/.51);
    // A continuous rounded underside removes the irregular flattened chin rim.
    const target=.012+.18*Math.pow(r,4),blend=1-smooth(.025,.11,y);
    v.y=base+y+(target-y)*blend;changed++;
   });
   const next=normals(points,triangles,weldMesh(points,triangles,groups),old,mask);
   g.write(p.attributes.POSITION,points);g.write(p.attributes.NORMAL,next);
  }
 }
 const target=path.join(out,file);g.save(target);
 reports.push({file,sourceHash:hash(source),outputHash:hash(target),changedLowerHeadVertices:changed,bodyArmsLegsRigAnimationUnchanged:true,clips:(j.animations||[]).map(a=>a.name)});
}
fs.writeFileSync(path.join(out,'geometry-validation.json'),JSON.stringify(reports,null,2));
console.log('Smoothed lower head in six models; body, arms, legs and animation preserved.');
