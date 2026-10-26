import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Glb} from '../somangi-reference-shape-v6/glb.mjs';
const root=path.resolve('.'),out=path.join(root,'output/character-assets-retired-2026-10-23');
const relative='web/assets/office/3d/Information-furnished-room.glb';
const source=path.join(out,'Information-furnished-room-original.glb');
if(!fs.existsSync(source))fs.copyFileSync(path.join(root,relative),source);
const g=new Glb(source),j=g.json;
assert.ok(!j.animations?.length&&!j.skins?.length&&(j.extensionsUsed||[]).every(e=>e.startsWith('KHR_materials_')),'Expected static room');
const names=new Set(['Anna_PlumpLeaf','Anna_Vest','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Somangi_Body']);
const removed=j.nodes.filter(n=>names.has(n.name));assert.equal(removed.length,6);
function select(key,ids){
 const map=new Map(),keep=[];
 (j[key]||[]).forEach((item,i)=>{if(ids.has(i)){map.set(i,keep.length);keep.push(item);}});
 j[key]=keep;return i=>{assert.ok(map.has(i),`${key} index ${i}`);return map.get(i);};
}
const nodeMap=select('nodes',new Set(j.nodes.flatMap((n,i)=>names.has(n.name)?[]:[i])));
// Node identities are already compacted; use original source names for old IDs.
const originalJson=new Glb(source).json;
for(const scene of j.scenes)scene.nodes=scene.nodes.filter(i=>!names.has(originalJson.nodes[i].name)).map(nodeMap);
for(const n of j.nodes)if(n.children)n.children=n.children.filter(i=>!names.has(originalJson.nodes[i].name)).map(nodeMap);
const meshMap=select('meshes',new Set(j.nodes.filter(n=>n.mesh!==undefined).map(n=>n.mesh)));
for(const n of j.nodes)if(n.mesh!==undefined)n.mesh=meshMap(n.mesh);
const primitives=j.meshes.flatMap(m=>m.primitives),accessors=new Set(),materials=new Set();
for(const p of primitives){
 for(const i of Object.values(p.attributes))accessors.add(i);
 if(p.indices!==undefined)accessors.add(p.indices);
 for(const target of p.targets||[])for(const i of Object.values(target))accessors.add(i);
 if(p.material!==undefined)materials.add(p.material);
}
const accessorMap=select('accessors',accessors),materialMap=select('materials',materials);
for(const p of primitives){
 for(const k of Object.keys(p.attributes))p.attributes[k]=accessorMap(p.attributes[k]);
 if(p.indices!==undefined)p.indices=accessorMap(p.indices);
 for(const target of p.targets||[])for(const k of Object.keys(target))target[k]=accessorMap(target[k]);
 if(p.material!==undefined)p.material=materialMap(p.material);
}
const textureRefs=[];
function visit(value){if(!value||typeof value!=='object')return;
 for(const [key,v]of Object.entries(value)){
  if(/Texture$/.test(key)&&v?.index!==undefined)textureRefs.push(v);else visit(v);
 }
}
j.materials.forEach(visit);
const textureMap=select('textures',new Set(textureRefs.map(r=>r.index)));
textureRefs.forEach(r=>r.index=textureMap(r.index));
const imageMap=select('images',new Set(j.textures.filter(t=>t.source!==undefined).map(t=>t.source)));
const samplerMap=select('samplers',new Set(j.textures.filter(t=>t.sampler!==undefined).map(t=>t.sampler)));
for(const t of j.textures){if(t.source!==undefined)t.source=imageMap(t.source);if(t.sampler!==undefined)t.sampler=samplerMap(t.sampler);}
const viewRefs=[];
for(const a of j.accessors){if(a.bufferView!==undefined)viewRefs.push(a);assert.ok(!a.sparse);}
for(const image of j.images)if(image.bufferView!==undefined)viewRefs.push(image);
const viewMap=select('bufferViews',new Set(viewRefs.map(r=>r.bufferView)));
viewRefs.forEach(r=>r.bufferView=viewMap(r.bufferView));
const chunks=[];let offset=0;
for(const view of j.bufferViews){
 assert.equal(view.buffer,0);
 const padding=(4-offset%4)%4;if(padding){chunks.push(Buffer.alloc(padding));offset+=padding;}
 chunks.push(g.original.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength));
 view.byteOffset=offset;offset+=view.byteLength;
}
if(offset%4){const padding=4-offset%4;chunks.push(Buffer.alloc(padding));offset+=padding;}
j.buffers=[{byteLength:offset}];
const binary=Buffer.concat(chunks);let json=Buffer.from(JSON.stringify(j));
json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+binary.length,8);header.writeUInt32LE(json.length,12);header.write('JSON',16);
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(binary.length);binHeader.write('BIN\0',4);
const target=path.join(out,'Information-furnished-room.glb');fs.writeFileSync(target,Buffer.concat([header,json,binHeader,binary]));
for(const base of [root,path.join(root,'electron-app/dist/win-unpacked/resources')]){
 const destination=path.join(base,relative);assert.ok(destination.startsWith(root+path.sep));
 try{fs.copyFileSync(target,destination);}catch(error){
  const backup=path.join(out,base===root?'web-room-before.glb':'runtime-room-before.glb');
  if(fs.existsSync(backup))throw error;fs.renameSync(destination,backup);fs.copyFileSync(target,destination);
 }
}
fs.writeFileSync(path.join(out,'embedded-removal.json'),JSON.stringify({removed:removed.map(n=>n.name),remainingNodes:j.nodes.length,sourceBytes:fs.statSync(source).size,resultBytes:fs.statSync(target).size},null,2));
console.log('Removed embedded Moa geometry and unused material/texture/buffer data; room preserved.');
