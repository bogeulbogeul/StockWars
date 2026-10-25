import test from 'node:test';
import assert from 'node:assert/strict';
import {SphereGeometry,Mesh,MeshBasicMaterial,Raycaster,Vector3,DoubleSide} from '../vendor/three/three.module.js';
import {createOcclusionQueries} from '../js/components/town3d/OcclusionQueries.js';

test('prepared high density meshes match native queries and safely fall back after edits',()=>{
    const geometry=new SphereGeometry(2,300,180),mesh=new Mesh(geometry,new MeshBasicMaterial({side:DoubleSide}));
    mesh.scale.set(1.4,.8,1.2);mesh.rotation.y=.3;mesh.updateMatrixWorld(true);
    const queries=createOcclusionQueries();queries.prepare(mesh);assert.equal(queries.preparedCount,1);
    for(let i=0;i<30;i++){
        const ray=new Raycaster(new Vector3(-4+i*.3,.2,5),new Vector3(0,0,-1),i%2?0:1,i%3?20:3);
        queries.enabled=false;const native=queries.intersects(mesh,ray);queries.enabled=true;assert.equal(queries.intersects(mesh,ray),native);
    }
    geometry.setDrawRange(0,6);
    const ray=new Raycaster(new Vector3(0,0,5),new Vector3(0,0,-1));
    assert.equal(queries.intersects(mesh,ray),ray.intersectObject(mesh).length>0);
    geometry.setDrawRange(0,Infinity);geometry.attributes.position.needsUpdate=true;
    assert.equal(queries.intersects(mesh,ray),ray.intersectObject(mesh).length>0);
});
