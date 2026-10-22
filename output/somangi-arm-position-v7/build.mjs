import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Glb} from '../somangi-reference-shape-v6/glb.mjs';
const out=path.resolve('output/somangi-arm-position-v7'),drop=.055;
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const reports=[];
for(const file of ['walk.glb','wave.glb','eat.glb','jump.glb','crab.glb','office-sit.glb']){
 const source=path.join(out,'original',file);fs.mkdirSync(path.dirname(source),{recursive:true});
 if(!fs.existsSync(source))fs.copyFileSync('web/assets/characters/3d/somangi/'+file,source);
 const g=new Glb(source),j=g.json,arms=new Set();
 j.nodes.forEach((n,i)=>{if(/^Arm\.[LR]$/.test(n.name)){arms.add(i);n.translation[1]-=drop;}});
 if(arms.size!==2)throw Error('Expected two arm pivots');
 for(const n of j.nodes){
  if(!/^Rigid_Arm\.[LR]$/.test(n.name))continue;
  for(const p of j.meshes[n.mesh].primitives){
   const positions=g.vectors(p.attributes.POSITION);positions.forEach(v=>v.y-=drop);g.write(p.attributes.POSITION,positions);
  }
 }
 // Translate inverse bind matrices with the new arm rest positions.
 for(const skin of j.skins){
  const a=g.accessor(skin.inverseBindMatrices);
  skin.joints.forEach((node,i)=>{if(!arms.has(node))return;
   const m=g.read(skin.inverseBindMatrices,i);
   for(let row=0;row<4;row++){
    const at=a.offset+i*a.stride+(12+row)*4;
    g.binary.writeFloatLE(m[12+row]+drop*m[4+row],at);
    for(let b=0;b<4;b++)g.changed.add(at+b);
   }
  });
 }
 const translated=new Set();
 for(const animation of j.animations||[])for(const c of animation.channels){
  if(!arms.has(c.target.node)||c.target.path!=='translation')continue;
  const s=animation.samplers[c.sampler],id=s.output;if(translated.has(id))continue;
  const v=g.vectors(id);v.forEach((p,i)=>{if(s.interpolation!=='CUBICSPLINE'||i%3===1)p.y-=drop;});
  g.write(id,v);translated.add(id);
 }
 // All non-arm position/normal accessors must remain byte-identical.
 for(const n of j.nodes){if(n.mesh===undefined||/^Rigid_Arm\./.test(n.name))continue;
  for(const p of j.meshes[n.mesh].primitives)for(const key of ['POSITION','NORMAL']){
   const a=g.accessor(p.attributes[key]);for(let i=0;i<a.a.count;i++)for(let b=0;b<a.width*a.bytes;b++){
    const at=a.offset+i*a.stride+b;if(g.binary[at]!==g.original[at])throw Error('Body changed');
   }
  }
 }
 const target=path.join(out,file);g.save(target);
 reports.push({file,sourceHash:hash(source),outputHash:hash(target),armDrop:drop,bodyGeometryUnchanged:true,armRotationScaleTimingUnchanged:true,clips:(j.animations||[]).map(a=>a.name)});
}
fs.writeFileSync(path.join(out,'geometry-validation.json'),JSON.stringify(reports,null,2));
console.log('Built six models; body geometry unchanged; arm pivots and translation tracks lowered together.');
