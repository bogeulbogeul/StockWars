import fs from 'node:fs';
import { Vector3 } from '../../web/vendor/three/three.module.js';
export class Glb {
 constructor(file){const b=fs.readFileSync(file),n=b.readUInt32LE(12);this.json=JSON.parse(b.toString('utf8',20,n+20));this.original=Buffer.from(b.subarray(n+28));this.binary=Buffer.from(this.original);this.changed=new Set();}
 accessor(i){const a=this.json.accessors[i],b=this.json.bufferViews[a.bufferView],width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],bytes={5121:1,5123:2,5125:4,5126:4}[a.componentType];return {a,width,bytes,offset:(a.byteOffset||0)+(b.byteOffset||0),stride:b.byteStride||width*bytes};}
 read(index,i){const v=this.accessor(index),at=v.offset+i*v.stride;return Array.from({length:v.width},(_,k)=>{const p=at+k*v.bytes;return v.a.componentType===5126?this.original.readFloatLE(p):v.a.componentType===5121?this.original.readUInt8(p):v.a.componentType===5123?this.original.readUInt16LE(p):this.original.readUInt32LE(p);});}
 vectors(index){const a=this.json.accessors[index];return Array.from({length:a.count},(_,i)=>new Vector3(...this.read(index,i)));}
 write(index,points){const v=this.accessor(index);if(v.a.componentType!==5126||v.width!==3)throw Error('Expected float3');const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<points.length;i++)for(let k=0;k<3;k++){const p=v.offset+i*v.stride+k*4,n=points[i].getComponent(k);if(!Number.isFinite(n))throw Error('Invalid coordinate');this.binary.writeFloatLE(n,p);for(let b=0;b<4;b++)this.changed.add(p+b);min[k]=Math.min(min[k],n);max[k]=Math.max(max[k],n);}if(v.a.min)v.a.min=min;if(v.a.max)v.a.max=max;}
 preserve(){for(let i=0;i<this.binary.length;i++)if(!this.changed.has(i)&&this.binary[i]!==this.original[i])throw Error('Unrelated binary changed');}
 save(file){this.preserve();let j=Buffer.from(JSON.stringify(this.json));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);const h=Buffer.alloc(20);h.write('glTF');h.writeUInt32LE(2,4);h.writeUInt32LE(j.length+this.binary.length+28,8);h.writeUInt32LE(j.length,12);h.write('JSON',16);const b=Buffer.alloc(8);b.writeUInt32LE(this.binary.length);b.write('BIN\0',4);fs.writeFileSync(file,Buffer.concat([h,j,b,this.binary]));}
}
export function weldMesh(points,triangles,groups){
 const lookup=new Map(),ids=[],positions=[],adj=[],members=[];
 points.forEach((p,i)=>{const key=`${groups[i]}:${p.x.toFixed(5)},${p.y.toFixed(5)},${p.z.toFixed(5)}`;if(!lookup.has(key)){lookup.set(key,positions.length);positions.push(p.clone());adj.push(new Set());members.push([]);}const id=lookup.get(key);ids.push(id);members[id].push(i);});
 for(let t=0;t<triangles.length;t+=3){const a=ids[triangles[t]],b=ids[triangles[t+1]],c=ids[triangles[t+2]];for(const [i,j]of[[a,b],[b,c],[c,a]])if(i!==j){adj[i].add(j);adj[j].add(i);}}
 return {ids,positions,adj,members};
}
export function smoothMesh(mesh,weights,passes){
 for(let pass=0;pass<passes;pass++){const next=mesh.positions.map(p=>p.clone());mesh.positions.forEach((p,i)=>{if(!weights[i]||!mesh.adj[i].size)return;const average=new Vector3();for(const k of mesh.adj[i])average.add(mesh.positions[k]);average.multiplyScalar(1/mesh.adj[i].size);next[i].lerp(average,.42*weights[i]);});mesh.positions=next;}
}
export function normals(points,triangles,mesh,old,mask){
 const sums=mesh.positions.map(()=>new Vector3()),ab=new Vector3(),ac=new Vector3();
 for(let t=0;t<triangles.length;t+=3){const a=triangles[t],b=triangles[t+1],c=triangles[t+2],n=ab.subVectors(points[b],points[a]).cross(ac.subVectors(points[c],points[a]));for(const i of[a,b,c])sums[mesh.ids[i]].add(n);}
 return old.map((n,i)=>mask[i]>0&&sums[mesh.ids[i]].lengthSq()>1e-15?sums[mesh.ids[i]].clone().normalize():n.clone());
}
