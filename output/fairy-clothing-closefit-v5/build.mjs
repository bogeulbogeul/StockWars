import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Matrix4, Quaternion, Vector3 } from '../../web/vendor/three/three.module.js';
const out=path.resolve('output/fairy-clothing-closefit-v5'),previous=path.resolve('output/fairy-clothing-refit-v4');
const files=['moa-bench-sit.glb','moa-bench-doze.glb','tori.glb','information-room.glb','bongbong.glb'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const reports=[];
for(const file of files){
 const source=fs.readFileSync(path.join(previous,file)),length=source.readUInt32LE(12);
 const j=JSON.parse(source.toString('utf8',20,length+20)),bin=Buffer.from(source.subarray(length+28)),original=Buffer.from(bin),edited=new Set();
 const vector=index=>{const a=j.accessors[index],b=j.bufferViews[a.bufferView];if(a.componentType!==5126||a.type!=='VEC3')throw Error('Unsupported vector');return {a,offset:(b.byteOffset||0)+(a.byteOffset||0),stride:b.byteStride||12};};
 const get=(a,i)=>new Vector3(...[0,1,2].map(k=>original.readFloatLE(a.offset+i*a.stride+4*k)));
 const put=(a,i,v)=>{for(let k=0;k<3;k++){const at=a.offset+i*a.stride+4*k;bin.writeFloatLE(v.getComponent(k),at);for(let b=0;b<4;b++)edited.add(at+b);}};
 const parents=new Map();j.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parents.set(c,i)));
 const local=j.nodes.map(n=>n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3().fromArray(n.translation||[0,0,0]),new Quaternion().fromArray(n.rotation||[0,0,0,1]),new Vector3().fromArray(n.scale||[1,1,1])));
 const cache=new Map();function world(i){if(!cache.has(i))cache.set(i,parents.has(i)?world(parents.get(i)).clone().multiply(local[i]):local[i].clone());return cache.get(i);}
 const ti=j.nodes.findIndex(n=>n.name==='Eating_Torso'),torso=vector(j.meshes[j.nodes[ti].mesh].primitives[0].attributes.POSITION);
 const bottom=torso.a.min[1],height=torso.a.max[1]-bottom,cx=(torso.a.min[0]+torso.a.max[0])/2,cz=(torso.a.min[2]+torso.a.max[2])/2;
 const pear=.30,f=u=>Math.sqrt(Math.max(0,1-u*u))*(1-pear*u),peak=(1-Math.sqrt(1+8*pear*pear))/(4*pear),norm=f(peak);
 const rx=(torso.a.max[0]-torso.a.min[0])/2,rz=(torso.a.max[2]-torso.a.min[2])/2;
 function radius(y,angle){const u=clamp(2*(y-bottom)/height-1,-.999999,.999999),q=f(u)/norm;return q/Math.sqrt((Math.cos(angle)/rx)**2+(Math.sin(angle)/rz)**2);}
 function polar(p){const angle=Math.atan2(p.z-cz,p.x-cx),r=Math.hypot(p.x-cx,p.z-cz);return {angle,r,gap:r-radius(p.y,angle)};}
 const rows=[];
 for(let ni=0;ni<j.nodes.length;ni++){
  const node=j.nodes[ni];if(node.mesh===undefined||!/^(Anna_Vest|AgentK_Vest|Bongbong_Meshy_Apron|Apron_Continuous_Waist_.*|Apron_Finished_Shoulder_.*)$/.test(node.name))continue;
  const isVest=/Vest/.test(node.name),isMain=/Meshy_Apron/.test(node.name),isWaist=/Waist/.test(node.name);
  const toTorso=world(ti).clone().invert().multiply(world(ni)),fromTorso=toTorso.clone().invert();
  const primitives=j.meshes[node.mesh].primitives;
  function fit(p){
   const {angle,gap}=polar(p),t=(p.y-bottom)/height;
   let y=p.y;
   // Preserve the approved garment lengths.
   
   // Smooth fitting curves avoid row transitions and retain raised seam/pocket detail.
   let desired;
   if(isVest)desired=.003+.36*gap;
   else if(isWaist)desired=.003+.34*gap;
   else if(isMain)desired=.004+gap*(.40+.20*smooth(.10,.28,cz-p.z));
   else desired=.003+.36*gap;
   const r=radius(y,angle)+desired;
   return new Vector3(cx+r*Math.cos(angle),y,cz+r*Math.sin(angle));
  }
  let maxMove=0,beforeGap=[],afterGap=[];
  for(const prim of primitives){
   if(prim.targets?.length)throw Error('Unexpected garment morph');
   const pos=vector(prim.attributes.POSITION),normal=vector(prim.attributes.NORMAL);
   for(let i=0;i<pos.a.count;i++){
    const p=get(pos,i),inTorso=p.clone().applyMatrix4(toTorso),fitted=fit(inTorso),next=fitted.clone().applyMatrix4(fromTorso);
    const e=1e-4,columns=[];
    for(let k=0;k<3;k++){const a=p.clone(),b=p.clone();a.setComponent(k,a.getComponent(k)+e);b.setComponent(k,b.getComponent(k)-e);columns.push(fit(a.applyMatrix4(toTorso)).applyMatrix4(fromTorso).sub(fit(b.applyMatrix4(toTorso)).applyMatrix4(fromTorso)).multiplyScalar(1/(2*e)));}
    const jacobian=new Matrix4().makeBasis(...columns).invert().transpose(),n=get(normal,i).transformDirection(jacobian);
    if(!Number.isFinite(next.lengthSq()+n.lengthSq()))throw Error('Invalid garment coordinates');
    put(pos,i,next);put(normal,i,n);maxMove=Math.max(maxMove,p.distanceTo(next));
    if(i%20===0){beforeGap.push(polar(inTorso).gap);afterGap.push(polar(fitted).gap);}
   }
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<pos.a.count;i++)for(let k=0;k<3;k++){const v=bin.readFloatLE(pos.offset+i*pos.stride+k*4);min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);}
   pos.a.min=min;pos.a.max=max;
  }
  const stats=a=>{a.sort((a,b)=>a-b);return {min:a[0],median:a[Math.floor(a.length/2)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};};
  rows.push({node:node.name,maxMove,before:stats(beforeGap),after:stats(afterGap),lengthReduction:0});
 }
 for(let i=0;i<bin.length;i++)if(!edited.has(i)&&bin[i]!==original[i])throw Error('Unrelated bytes changed');
 let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.write('JSON',16);
 const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.write('BIN\0',4);const output=Buffer.concat([header,json,bh,bin]);
 fs.writeFileSync(path.join(out,file),output);reports.push({file,altered:rows,bodyHeadLimbsRigWeightsClipsUnchanged:true,sourceHash:sha(source),outputHash:sha(output),clips:(j.animations||[]).map(a=>a.name)});
}
fs.writeFileSync(path.join(out,'geometry-validation.json'),JSON.stringify(reports,null,2));
console.log('Refitted',reports.length,'clothed models; all body and animation bytes preserved.');

