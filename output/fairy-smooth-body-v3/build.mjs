import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Matrix4, Quaternion, Vector3 } from '../../web/vendor/three/three.module.js';
const here=path.resolve('output/fairy-smooth-body-v3'), previous=path.resolve('output/fairy-leg-fix-v2');
const manifest=JSON.parse(fs.readFileSync('output/fairy-body-narrow-v1/validation.json'));
const pear=.30, extension=.08;
const f=u=>Math.sqrt(Math.max(0,1-u*u))*(1-pear*u);
const peak=(-1+Math.sqrt(1+8*pear*pear))/(4*pear)*-1;
const norm=f(peak), report=[];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const entry of manifest){
 const source=fs.readFileSync(path.join(previous,entry.output));
 const jsLength=source.readUInt32LE(12),j=JSON.parse(source.toString('utf8',20,jsLength+20));
 const bin=Buffer.from(source.subarray(jsLength+28)),original=Buffer.from(bin),changed=new Set();
 const v3=index=>{const a=j.accessors[index],b=j.bufferViews[a.bufferView];if(a.componentType!==5126||a.type!=='VEC3')throw Error('Unsupported accessor');return {a,offset:(b.byteOffset||0)+(a.byteOffset||0),stride:b.byteStride||12};};
 const get=(v,i)=>new Vector3(...[0,1,2].map(k=>original.readFloatLE(v.offset+i*v.stride+4*k)));
 const put=(v,i,p)=>{for(let k=0;k<3;k++){const at=v.offset+i*v.stride+4*k;bin.writeFloatLE(p.getComponent(k),at);for(let z=0;z<4;z++)changed.add(at+z);}};
 const local=j.nodes.map(n=>n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3().fromArray(n.translation||[0,0,0]),new Quaternion().fromArray(n.rotation||[0,0,0,1]),new Vector3().fromArray(n.scale||[1,1,1])));
 const parents=new Map();j.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parents.set(c,i)));
 const cache=new Map();function world(i){if(!cache.has(i))cache.set(i,parents.has(i)?world(parents.get(i)).clone().multiply(local[i]):local[i].clone());return cache.get(i);}
 const torsoIndex=j.nodes.findIndex(n=>n.name==='Eating_Torso');if(torsoIndex<0)throw Error('Missing torso');
 const torsoPrimitive=j.meshes[j.nodes[torsoIndex].mesh].primitives[0],pos=v3(torsoPrimitive.attributes.POSITION);
 const bottom=pos.a.min[1],top=pos.a.max[1],height=top-bottom;
 const cx=(pos.a.min[0]+pos.a.max[0])/2,cz=(pos.a.min[2]+pos.a.max[2])/2;
 const rx=(pos.a.max[0]-pos.a.min[0])/2,rz=(pos.a.max[2]-pos.a.min[2])/2;
 const rings=new Map();for(let i=0;i<pos.a.count;i++){const p=get(pos,i),key=p.y.toFixed(5);if(!rings.has(key))rings.set(key,{h:p.y,x:0,z:0});const r=rings.get(key);r.x=Math.max(r.x,Math.abs(p.x-cx));r.z=Math.max(r.z,Math.abs(p.z-cz));}
 const sections=[...rings.values()].sort((a,b)=>a.h-b.h);
 function oldRadius(y){let b=sections.findIndex(r=>r.h>=y);if(b<=0)return sections[0];const a=sections[b-1];const r=sections[b],t=(y-a.h)/(r.h-a.h);return {x:a.x+(r.x-a.x)*t,z:a.z+(r.z-a.z)*t};}
 function deform(p){
  if(p.y<bottom||p.y>top)return p.clone();
  const t=(p.y-bottom)/height,u=2*t-1,r=oldRadius(p.y),q=f(u)/norm;
  // Preserve garment thickness/clearance, rather than magnifying it near poles.
  const smooth=(a,b,v)=>{const u=Math.max(0,Math.min(1,(v-a)/(b-a)));return u*u*(3-2*u);};
  const blend=smooth(.03,.18,t)*(1-smooth(.92,1,t));
  const angle=Math.atan2((p.z-cz)/Math.max(r.z,1e-6),(p.x-cx)/Math.max(r.x,1e-6));
  return new Vector3(p.x+(rx*q-r.x)*Math.cos(angle)*blend,p.y+extension*t*blend,p.z+(rz*q-r.z)*Math.sin(angle)*blend);
 }
 const altered=[];
 for(let ni=0;ni<j.nodes.length;ni++){
  const node=j.nodes[ni],isTorso=ni===torsoIndex;
  if(node.mesh===undefined||(!isTorso&&!/^(Anna_Vest|AgentK_Vest|Bongbong_Meshy_Apron|Apron_Continuous_Waist_.*|Apron_Finished_Shoulder_.*)$/.test(node.name)))continue;
  const toTorso=world(torsoIndex).clone().invert().multiply(world(ni)),fromTorso=toTorso.clone().invert();
  let maxMove=0;
  for(const prim of j.meshes[node.mesh].primitives){
   if(prim.targets?.length)throw Error('Unexpected torso/wardrobe morph');
   const p=v3(prim.attributes.POSITION),n=v3(prim.attributes.NORMAL);
   for(let i=0;i<p.a.count;i++){
    const old=get(p,i);let next,normal;
    if(isTorso){
     const t=(old.y-bottom)/height,u=2*t-1,q=f(u)/norm;
     const angle=Math.atan2((old.z-cz)/rz,(old.x-cx)/rx);
     next=new Vector3(cx+rx*q*Math.cos(angle),bottom+(height+extension)*t,cz+rz*q*Math.sin(angle));
     if(Math.abs(u)>.99999)normal=new Vector3(0,Math.sign(u),0);
     else {const s=Math.sqrt(1-u*u),df=(-u/s*(1-pear*u)-pear*s)/norm*2/(height+extension);normal=new Vector3(Math.cos(angle)/rx,-df,Math.sin(angle)/rz).normalize();}
    }else{
     const rest=old.clone().applyMatrix4(toTorso);next=deform(rest).applyMatrix4(fromTorso);
     // Numerical Jacobian inverse-transpose preserves smooth wardrobe shading.
     const e=1e-4,cols=[];
     for(let k=0;k<3;k++){const a=old.clone(),b=old.clone();a.setComponent(k,a.getComponent(k)+e);b.setComponent(k,b.getComponent(k)-e);cols.push(deform(a.applyMatrix4(toTorso)).applyMatrix4(fromTorso).sub(deform(b.applyMatrix4(toTorso)).applyMatrix4(fromTorso)).multiplyScalar(1/(2*e)));}
     const jac=new Matrix4().makeBasis(...cols).invert().transpose();normal=get(n,i).transformDirection(jac);
    }
    maxMove=Math.max(maxMove,old.distanceTo(next));put(p,i,next);put(n,i,normal);
   }
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<p.a.count;i++)for(let k=0;k<3;k++){const value=bin.readFloatLE(p.offset+i*p.stride+k*4);min[k]=Math.min(min[k],value);max[k]=Math.max(max[k],value);}
   p.a.min=min;p.a.max=max;
  }
  altered.push({node:node.name,maxMove});
 }
 for(let i=0;i<bin.length;i++)if(!changed.has(i)&&bin[i]!==original[i])throw Error('Unrelated binary changed');
 let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.write('JSON',16);
 const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.write('BIN\0',4);
 const output=Buffer.concat([header,json,bh,bin]);fs.writeFileSync(path.join(here,entry.output),output);
 report.push({file:entry.output,altered,headLegsArmsRigWeightsClipsUnchanged:true,clips:entry.clips,sourceHash:sha(source),outputHash:sha(output)});
}
fs.writeFileSync(path.join(here,'geometry-validation.json'),JSON.stringify(report,null,2));
console.log('Built',report.length,'smooth torso/wardrobe models; existing head, legs, arms, rig and motion bytes preserved.');
