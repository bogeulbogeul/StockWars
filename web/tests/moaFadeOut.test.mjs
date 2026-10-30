import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from '../vendor/three/three.module.js';
import { fadeOutMoa } from '../js/app/exhibition/MoaFadeOut.js';

test('Moa fades gradually using temporary materials and restores originals for later appearances', async () => {
 const root=new Group(), material=new MeshBasicMaterial({opacity:.8}), mesh=new Mesh(new BoxGeometry(),material);
 mesh.castShadow=true;root.add(mesh);let now=0,sawPartial=false;
 const saved={document:globalThis.document,raf:globalThis.requestAnimationFrame,cancel:globalThis.cancelAnimationFrame};
 globalThis.document={hidden:false};
 globalThis.requestAnimationFrame=callback=>setImmediate(()=>{now+=50;callback(now);if(mesh.material!==material&&mesh.material.opacity>0&&mesh.material.opacity<.8){sawPartial=true;assert.equal(root.visible,true);assert.equal(material.opacity,.8);}});
 globalThis.cancelAnimationFrame=clearImmediate;
 try {await fadeOutMoa(root);assert(sawPartial);assert.equal(root.visible,false);assert.equal(mesh.material,material);assert.equal(mesh.castShadow,true);assert.equal(material.transparent,false);root.visible=true;assert.equal(mesh.material.opacity,.8);}
 finally {if(saved.document===undefined)delete globalThis.document;else globalThis.document=saved.document;globalThis.requestAnimationFrame=saved.raf;globalThis.cancelAnimationFrame=saved.cancel;mesh.geometry.dispose();material.dispose();}
});
