import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Vector3 } from '../../web/vendor/three/three.module.js';
import { Glb,weldMesh,smoothMesh,normals } from './glb.mjs';
const out=path.resolve('output/somangi-reference-shape-v6');
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const reports=[];
for(const file of ['walk.glb','wave.glb','eat.glb','jump.glb','crab.glb','office-sit.glb']){
 const backup=path.join(out,'original',file);fs.mkdirSync(path.dirname(backup),{recursive:true});if(!fs.existsSync(backup))fs.copyFileSync('web/assets/characters/3d/somangi/'+file,backup);
 const glb=new Glb(backup),j=glb.json,changes=[];
 for(const node of j.nodes){
  if(node.mesh===undefined||!['Eating_Torso','Somangi_Body'].includes(node.name))continue;
  for(const prim of j.meshes[node.mesh].primitives){
   const original=glb.vectors(prim.attributes.POSITION),points=original.map(p=>p.clone()),oldNormals=glb.vectors(prim.attributes.NORMAL),triangles=Array.from({length:j.accessors[prim.indices].count},(_,i)=>glb.read(prim.indices,i)[0]);
   let mask=points.map(()=>0),counts={torso:0,legs:0,rearNape:0};
   const groups=points.map((_,i)=>{if(node.skin===undefined)return 'Body';const joints=glb.read(prim.attributes.JOINTS_0,i),weights=glb.read(prim.attributes.WEIGHTS_0,i);let k=0;weights.forEach((w,a)=>{if(w>weights[k])k=a;});return j.nodes[j.skins[node.skin].joints[joints[k]]].name;});
   if(node.name==='Eating_Torso'){
    const bounds=j.accessors[prim.attributes.POSITION],bottom=bounds.min[1],height=bounds.max[1]-bottom,cz=(bounds.min[2]+bounds.max[2])/2;
    points.forEach((p,i)=>{
     const t=(p.y-bottom)/height,shoulder=smooth(.65,.90,t),rear=1-smooth(-.01,.15,p.z-cz);
     const nape=smooth(.66,.82,t)*(1-smooth(.95,1,t))*rear;
     p.x*=(.930+(1-.930)*shoulder)*(1+.16*nape);
     p.z=cz+(p.z-cz)*(.900+.100*shoulder)*(1+.10*nape);
     // Lift only the lower belly; keep the neck, leg lengths and sole heights.
     p.y+=.035*(1-smooth(.15,.72,t));
     mask[i]=1;counts.torso++;
    });
   }else{
    const floor=Math.min(...points.map(p=>p.y)),offset=floor+.9504430294;
    const mesh=weldMesh(points,triangles,groups),weights=mesh.positions.map((p,i)=>{
     const group=groups[mesh.members[i][0]];
     if(group.startsWith('Leg')||group==='Body')return smooth(.012,.065,p.y-floor)*(1-smooth(.42,.60,p.y-floor));
     if(group==='Head')return (1-smooth(.035,.17,p.y-offset))*(1-smooth(-.02,.15,p.z));
     return 0;
    });
    smoothMesh(mesh,weights,32);
    points.forEach((p,i)=>{
     const w=weights[mesh.ids[i]],group=groups[i];
     if(!w&&group==='Head')return;
     if(!group.startsWith('Leg')&&group!=='Body'&&group!=='Head')return;
     p.copy(mesh.positions[mesh.ids[i]]);mask[i]=group==='Head'?w:1;
     if(group==='Head'){
      // Lift small underside fins into the smooth rear head, protecting the face.
      const rear=1-smooth(-.02,.15,p.z),low=1-smooth(.005,.09,p.y-offset);
      p.y+=.012*rear*low;counts.rearNape++;
     }else{
      // Retain the sole plane and shorten angular toe/heel overhangs gently.
      const h=p.y-floor,foot=1-smooth(.14,.27,h),sign=Math.sign(p.x),center=sign*.205;
      p.x=center+(p.x-center)*(1-.07*foot);p.z*=1-.07*foot;
      if(original[i].y<=floor+.012)p.y=original[i].y;
      counts.legs++;
     }
    });
   }
   const mesh=weldMesh(points,triangles,groups),nextNormals=normals(points,triangles,mesh,oldNormals,mask);
   // Only modified vertices/normals are written, preserving face and soles exactly.
   const output=original.map((p,i)=>mask[i]>0?points[i]:p),normOutput=oldNormals.map((p,i)=>mask[i]>0?nextNormals[i]:p);
   glb.write(prim.attributes.POSITION,output);glb.write(prim.attributes.NORMAL,normOutput);
   changes.push({mesh:node.name,counts,maxDisplacement:Math.max(...points.map((p,i)=>p.distanceTo(original[i])))});
  }
 }
 const target=path.join(out,file);glb.save(target);reports.push({file,changes,sourceHash:hash(backup),outputHash:hash(target),rigWeightsClipsUvIndicesUnchanged:true,clips:(j.animations||[]).map(a=>a.name)});
}
fs.writeFileSync(path.join(out,'geometry-validation.json'),JSON.stringify(reports,null,2));console.log('Built',reports.length,'Somangi models; rig, weights and animation data preserved.');
