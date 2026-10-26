import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Group, Mesh, BoxGeometry, MeshStandardMaterial, Vector3, PerspectiveCamera, Raycaster } from '../vendor/three/three.module.js';
import { TownStaticBatches } from '../js/components/town3d/TownStaticBatches.js';

function fixture(extension = true) {
    const scene = new Scene(), root = new Group();
    root.userData.dialogueOccluder = true; scene.add(root);
    const geometry = new BoxGeometry(), material = new MeshStandardMaterial();
    geometry.clearGroups();
    for (let i = 0; i < 5; i++) { const mesh = new Mesh(geometry, material); mesh.position.x = i * 5; root.add(mesh); }
    scene.updateMatrixWorld(true);
    return { scene, root, renderer: { extensions: { has: () => extension } } };
}

test('disabled batching keeps the original scene renderer', () => {
    const {scene, root, renderer} = fixture(false);
    const batches = new TownStaticBatches(scene, renderer);
    batches.enabled = false;
    let rendered = false; renderer.render = () => { rendered = true; assert(root.children.every(m => m.visible)); };
    batches.render(renderer, scene, {}); assert(rendered);
});

test('render copies never participate in scene raycasts', () => {
    const {scene, renderer} = fixture();
    const batches = new TownStaticBatches(scene);
    const {batch} = batches.groups[0];
    const ray = new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1));
    batch.visible = true;
    assert.equal(ray.intersectObject(batch, false).length, 0);
    assert(ray.intersectObjects(scene.children, true).every(hit => hit.object !== batch));
});

test('world vertices preserve source transforms and restore visibility after failure', () => {
    const {scene, root, renderer} = fixture();
    const batches = new TownStaticBatches(scene, renderer);
    assert.equal(batches.groups.length, 1);
    const {batch, members} = batches.groups[0];
    const point = new Vector3().fromBufferAttribute(batch.geometry.attributes.position, 3 * 24);
    const expected = new Vector3().fromBufferAttribute(members[3].mesh.geometry.attributes.position, 0).applyMatrix4(members[3].mesh.matrixWorld);
    assert(point.distanceTo(expected) < 1e-6);
    root.children[1].visible = false;
    renderer.render = () => {
        assert(batch.visible); assert(root.children.every(m => !m.visible));
        assert.equal(members[1].visible, false);
        assert.equal(members[0].visible, true);
        assert.equal(batch.geometry.drawRange.count, 4 * 36);
        throw Error('render failure');
    };
    assert.throws(() => batches.render(renderer, scene, {}), /render failure/);
    assert.equal(batch.visible, false);
    assert.equal(root.children[1].visible, false);
    assert(root.children.filter((_,i) => i !== 1).every(m => m.visible));
});

test('animated clock, mirrored and transparent meshes retain the original path', () => {
    const {scene, root, renderer} = fixture();
    const clock = root.children[0]; clock.name = 'Clock_Hour';
    const mirrored = root.children[1]; mirrored.scale.x = -1;
    const transparent = root.children[2]; transparent.material = transparent.material.clone(); transparent.material.transparent = true;
    scene.updateMatrixWorld(true);
    const batches = new TownStaticBatches(scene, renderer);
    assert.equal(batches.groups.length, 0);
});

test('nested source meshes are decided before hiding any parent source', () => {
    const {scene, root, renderer} = fixture();
    const nested = root.children[1]; root.children[0].add(nested); scene.updateMatrixWorld(true);
    const batches = new TownStaticBatches(scene, renderer);
    const {batch, members} = batches.groups[0];
    renderer.render = () => { for(const m of members) assert.equal(m.visible, true); assert.equal(batch.geometry.drawRange.count, 5 * 36); };
    batches.render(renderer, scene, {});
    assert(root.children.every(m => m.visible)); assert(nested.visible);
});

test('camera direction reorders indices and hidden parts are removed without changing vertices', () => {
    const {scene, root, renderer} = fixture();
    const batches = new TownStaticBatches(scene);
    const {batch, members} = batches.groups[0];
    const vertices = batch.geometry.attributes.position.array.slice();
    const camera = new PerspectiveCamera();
    camera.position.set(50, 0, 0); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    renderer.render = () => assert(batch.geometry.index.array[0] >= 4 * 24);
    batches.render(renderer, scene, camera);
    camera.position.set(-50, 0, 0); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    members[0].mesh.visible = false;
    renderer.render = () => {
        assert(batch.geometry.index.array[0] >= 24 && batch.geometry.index.array[0] < 48);
        assert.equal(batch.geometry.drawRange.count, 4 * 36);
    };
    batches.render(renderer, scene, camera);
    assert.deepEqual(batch.geometry.attributes.position.array, vertices);
    assert.equal(members[0].mesh.visible, false);
});
test('animated prop subtrees stay native and a nested draw restores source visibility', () => {
    const {scene, root, renderer} = fixture();
    const animated = new Group(); animated.userData.renderAnimated = true; root.add(animated);
    const geometry = new BoxGeometry(), material = new MeshStandardMaterial(); geometry.clearGroups();
    for (let i=0;i<5;i++) animated.add(new Mesh(geometry, material));
    scene.updateMatrixWorld(true);
    const batches = new TownStaticBatches(scene, {roots:[root], maxTriangles:8192});
    assert(batches.groups.every(group => group.members.every(member => !member.parents.includes(animated))));
    let nativeCalls=0;renderer.render=()=>nativeCalls++;
    assert.throws(()=>batches.render(renderer,scene,{},()=>{assert(animated.children.every(mesh=>mesh.visible));throw Error('nested draw');}),/nested draw/);
    assert.equal(nativeCalls,0);assert(root.children.every(mesh=>mesh.visible));
});
