import test from 'node:test';
import assert from 'node:assert/strict';
import {SphereGeometry,Mesh,MeshBasicMaterial,Raycaster,Vector3,FrontSide,BackSide,DoubleSide,Group,BoxGeometry} from '../vendor/three/three.module.js';
import {TriangleRayIndex} from '../js/components/town3d/TriangleRayIndex.js';
import {createOcclusionQueries} from '../js/components/town3d/OcclusionQueries.js';

function rays() {
    const result=[]; let seed=197;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<600;i++){
        const origin=new Vector3((random()-.5)*14,(random()-.5)*14,(random()-.5)*14);
        const target=new Vector3((random()-.5)*5,(random()-.5)*5,(random()-.5)*5);
        result.push(new Raycaster(origin,target.sub(origin).normalize(),i%4===0?2:0,i%3===0?4:30));
    }
    return result;
}

test('hierarchy matches native triangle hits across transforms, sides, near/far and indexed/nonindexed geometry',()=>{
    for(const indexed of [true,false]){
        const geometry=indexed?new SphereGeometry(2,24,16):new SphereGeometry(2,24,16).toNonIndexed();
        const index=new TriangleRayIndex(geometry);
        const mesh=new Mesh(geometry,new MeshBasicMaterial());
        mesh.position.set(.6,-.3,.8);mesh.rotation.set(.2,.7,-.3);mesh.scale.set(1.2,.8,1.6);mesh.updateMatrixWorld(true);
        for(const side of [FrontSide,BackSide,DoubleSide]){mesh.material.side=side;
            for(const ray of rays())assert.equal(index.intersects(mesh,ray),ray.intersectObject(mesh).length>0);
        }
    }
});

test('boundary, parallel and inside rays retain native results',()=>{
    const geometry=new BoxGeometry(2,2,2),index=new TriangleRayIndex(geometry),mesh=new Mesh(geometry,new MeshBasicMaterial({side:DoubleSide}));mesh.updateMatrixWorld(true);
    for(const origin of [[1,1,3],[0,0,0],[1,0,3],[0,3,0],[4,4,4]])for(const direction of [[0,0,-1],[1,0,0],[0,-1,0]]){
        const ray=new Raycaster(new Vector3(...origin),new Vector3(...direction),0,20);
        assert.equal(index.intersects(mesh,ray),ray.intersectObject(mesh).length>0);
    }
});

test('geometry attribute changes invalidate the index',()=>{
    const geometry=new SphereGeometry(2,12,8),index=new TriangleRayIndex(geometry);
    assert(index.matches(geometry));geometry.attributes.position.needsUpdate=true;assert(!index.matches(geometry));
});

test('scene queries preserve layers, custom recursion and invisible authored meshes',()=>{
    const root=new Group(),mesh=new Mesh(new BoxGeometry(),new MeshBasicMaterial());root.add(mesh);root.updateMatrixWorld(true);mesh.visible=false;
    const queries=createOcclusionQueries(),ray=new Raycaster(new Vector3(0,0,5),new Vector3(0,0,-1));
    assert.equal(queries.intersects(root,ray),true);mesh.layers.set(2);assert.equal(queries.intersects(root,ray),false);
    mesh.layers.set(0);root.raycast=()=>false;assert.equal(queries.intersects(root,ray),false);
});
