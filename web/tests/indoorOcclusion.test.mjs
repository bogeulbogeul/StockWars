import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshBasicMaterial, PerspectiveCamera, FrontSide } from '../vendor/three/three.module.js';
import { createIndoorOcclusion, renderIndoorWithOcclusion } from '../js/components/town3d/IndoorOcclusion.js';

function fixture() {
    const scene = new Group(), room = new Group(), actor = new Group(); scene.add(room, actor);
    const front = new Mesh(new BoxGeometry(200, 220, 10), new MeshBasicMaterial());
    front.name = 'Room_Side_Wall'; front.position.set(0, 100, 150); room.add(front);
    const back = front.clone(); back.material = front.material; back.name = 'Room_Back_Wall'; back.position.z = -150; room.add(back);
    const floor = new Mesh(new BoxGeometry(500, 10, 500), front.material); floor.name = 'Floor'; floor.position.y = -10; room.add(floor);
    const camera = new PerspectiveCamera(45, 1.6, 1, 2000);
    camera.position.set(0, 150, 400); camera.lookAt(0, 60, 0); camera.updateMatrixWorld(true);
    return { scene, room, actor, front, back, floor, camera };
}
test('only walls between camera and actor disappear and camera movement restores them', () => {
    const f = fixture(), occlusion = createIndoorOcclusion(f.room);
    assert(occlusion.update(f.camera, [f.actor]) > 0);
    assert.equal(f.front.visible, false); assert.equal(f.back.visible, true); assert.equal(f.floor.visible, true);
    assert.equal(f.front.material.side, FrontSide);
    f.camera.position.z = -400; f.camera.lookAt(0, 60, 0);
    occlusion.update(f.camera, [f.actor]);
    assert.equal(f.front.visible, true); assert.equal(f.back.visible, false);
    occlusion.reset(); assert.equal(f.back.visible, true);
});
test('existing cutaway visibility is preserved and hidden actors do not remove walls', () => {
    const f = fixture(); f.front.visible = false;
    const occlusion = createIndoorOcclusion(f.room); occlusion.update(f.camera, [f.actor]); occlusion.reset();
    assert.equal(f.front.visible, false);
    f.front.visible = true; f.actor.visible = false;
    assert.equal(occlusion.update(f.camera, [f.actor]), 0); assert.equal(f.front.visible, true);
});
test('render wrapper hides blockers for the render and restores even if the renderer fails', () => {
    const f = fixture(); let calls = 0;
    assert.throws(() => renderIndoorWithOcclusion({ ...f, player: { root: f.actor }, renderer: { render() {
        calls++; assert.equal(f.front.visible, false); throw new Error('render test');
    } } }), /render test/);
    assert.equal(calls, 1); assert.equal(f.front.visible, true);
});

test('dialogue hides foreground furniture for either speaker and restores when speech ends', () => {
    const f = fixture(); f.front.visible = false;
    const desk = new Mesh(new BoxGeometry(150, 100, 20), f.front.material);
    desk.name = 'Counter'; desk.position.set(0, 60, 100); f.room.add(desk);
    const behind = desk.clone(); behind.position.z = -100; f.room.add(behind);
    const occlusion = createIndoorOcclusion(f.room);
    occlusion.update(f.camera, [f.actor], { speaking: false });
    assert.equal(desk.visible, true);
    occlusion.update(f.camera, [f.actor], { speaking: true });
    assert.equal(desk.visible, false); assert.equal(behind.visible, true);
    assert.equal(f.floor.visible, true); assert.equal(desk.material.side, FrontSide);
    occlusion.update(f.camera, [f.actor], { speaking: false });
    assert.equal(desk.visible, true); assert.equal(f.front.visible, false);
});

test('dialogue never hides the other character or reveals authored hidden furniture', () => {
    const f = fixture(); f.front.visible = false;
    const resident = new Group(); resident.name = 'tori-character'; f.room.add(resident);
    const body = new Mesh(new BoxGeometry(80, 100, 30), f.front.material);
    body.position.set(0, 60, 100); resident.add(body);
    const hidden = body.clone(); hidden.visible = false; f.room.add(hidden);
    const occlusion = createIndoorOcclusion(f.room);
    occlusion.update(f.camera, [f.actor, resident], { speaking: true }); occlusion.reset();
    assert.equal(body.visible, true); assert.equal(hidden.visible, false);
});

test('counter body, top and attached decoration hide together without floating pieces', () => {
    const f = fixture(); f.front.visible = false;
    const body = new Mesh(new BoxGeometry(150,100,20), f.front.material);
    body.name = 'Counter_Cream_Body'; body.position.set(0,60,100); f.room.add(body);
    const top = body.clone(); top.name = 'Counter_Honey_Top'; top.position.x = 250; f.room.add(top);
    const ornament = top.clone(); ornament.name = 'Counter_Flower_Center'; ornament.visible = false; f.room.add(ornament);
    const occlusion = createIndoorOcclusion(f.room);
    occlusion.update(f.camera, [f.actor], { speaking:true });
    assert.equal(body.visible, false); assert.equal(top.visible, false);
    occlusion.reset();
    assert.equal(body.visible,true); assert.equal(top.visible,true); assert.equal(ornament.visible,false);
});

test('reception desk stays when covering only legs but still hides when covering the face',()=>{
 const f=fixture();f.front.visible=false;
 const desk=new Group();desk.name='cipher-cozy-desk';desk.userData.dialogueOcclusionMinHeight=80;f.room.add(desk);
 const body=new Mesh(new BoxGeometry(150,70,20),f.front.material);body.position.set(0,35,100);desk.add(body);
 const occlusion=createIndoorOcclusion(f.room);occlusion.update(f.camera,[f.actor],{speaking:true});assert.equal(body.visible,true);occlusion.reset();
 body.position.y=90;const raised=createIndoorOcclusion(f.room);raised.update(f.camera,[f.actor],{speaking:true});assert.equal(body.visible,false);raised.reset();assert.equal(body.visible,true);
});
