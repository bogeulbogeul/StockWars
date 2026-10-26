import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Mesh, MeshBasicMaterial, Scene, Group, PerspectiveCamera, Vector3, Box3, Frustum, Matrix4 } from '../vendor/three/three.module.js';
import { TownRenderCulling } from '../js/components/town3d/TownRenderCulling.js';

const mesh = () => new Mesh(new BoxGeometry(20, 20, 20), new MeshBasicMaterial());
const camera = () => { const c = new PerspectiveCamera(50, 1.6, 1, 12000); c.position.set(0, 600, 900); c.lookAt(0, 0, -700); c.updateMatrixWorld(); return c; };

test('temporary culling restores original visibility even on renderer failure', () => {
    const scene = new Scene(), culling = new TownRenderCulling();
    const outside = mesh(), alreadyHidden = mesh();
    outside.position.x = 50000; alreadyHidden.visible = false;
    scene.add(outside, alreadyHidden); culling.add(outside); culling.add(alreadyHidden);
    const renderer = { render() { assert.equal(outside.visible, false); throw new Error('renderer failure'); } };
    assert.throws(() => culling.render(renderer, scene, camera(), 0), /renderer failure/);
    assert.equal(outside.visible, true); assert.equal(alreadyHidden.visible, false);
});

test('clock hands and skinned meshes do not receive stale part bounds', () => {
    const root = new Group(), hand = new Group(), moving = mesh(), body = mesh();
    hand.name = 'Clock_Minute'; hand.add(moving); root.add(hand, body);
    const culling = new TownRenderCulling(); culling.add(root);
    assert(culling.entries.some(e => e.root === root));
    assert(culling.entries.some(e => e.root === body));
    assert(!culling.entries.some(e => e.root === moving));
});

test('curved bounds retain every sampled vertex inside the camera frustum', () => {
    const c = camera(), scene = new Scene(), culling = new TownRenderCulling();
    const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse));
    const samples = [];
    for (let z = -6000; z <= 2000; z += 400) for (let x = -4000; x <= 4000; x += 400) {
        const object = mesh(); object.position.set(x, 100, z); object.scale.set(8, 15, 12);
        scene.add(object); culling.add(object); samples.push(object);
    }
    for (const centerZ of [-1500, 0, 2000, 4500]) {
        c.position.set(0, 600, centerZ + 900);
        c.lookAt(0, 0, centerZ - 700); c.updateMatrixWorld();
        frustum.setFromProjectionMatrix(new Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse));
        let visibleSamples = 0;
        culling.render({render() {
            for (const object of samples) {
                const box = new Box3().setFromObject(object), point = new Vector3();
                for (const tx of [0, .5, 1]) for (const ty of [0, .5, 1]) for (const tz of [0, .5, 1]) {
                    point.set(box.min.x + tx * (box.max.x - box.min.x), box.min.y + ty * (box.max.y - box.min.y), box.min.z + tz * (box.max.z - box.min.z));
                    point.y -= .00018 * Math.max(0, centerZ - point.z - 1100) ** 2;
                    if (frustum.containsPoint(point)) { visibleSamples++; assert.equal(object.visible, true); }
                }
            }
        }}, scene, c, centerZ);
        assert(visibleSamples > 0);
        assert(samples.every(o => o.visible));
    }
});
