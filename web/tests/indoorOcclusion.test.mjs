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
