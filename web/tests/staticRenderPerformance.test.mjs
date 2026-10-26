import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Group, Mesh, BoxGeometry, MeshStandardMaterial, Vector3, Raycaster } from '../vendor/three/three.module.js';
import { StaticInstances } from '../js/components/town3d/StaticInstances.js';
import { StaticRenderLod } from '../js/components/town3d/StaticRenderLod.js';

function fixture() {
    const scene = new Scene(), root = new Group(), geometry = new BoxGeometry(), material = new MeshStandardMaterial();
    scene.add(root); root.position.set(20, 3, 7);
    const meshes = Array.from({ length: 4 }, (_, i) => {
        const mesh = new Mesh(geometry, material); mesh.position.x = i * 4; root.add(mesh); return mesh;
    });
    scene.updateMatrixWorld(true);
    return { scene, root, meshes };
}
test('static instances preserve world transforms, per-part visibility and original raycasts', () => {
    const f = fixture(), batch = new StaticInstances(f.scene, [f.root]);
    assert.equal(batch.groups.length, 1);
    f.meshes[1].visible = false;
    batch.render(() => {
        const rendered = batch.groups[0].batch;
        assert.equal(rendered.count, 3);
        assert(f.meshes.every(mesh => !mesh.visible));
        const matrix = f.meshes[0].matrixWorld.clone();
        rendered.getMatrixAt(1, matrix);
        assert.deepEqual(new Vector3().setFromMatrixPosition(matrix).toArray(), [28, 3, 7]);
    });
    assert.equal(f.meshes[0].visible, true); assert.equal(f.meshes[1].visible, false);
    const ray = new Raycaster(new Vector3(20, 3, 20), new Vector3(0, 0, -1));
    assert(ray.intersectObjects(f.scene.children, true).every(hit => !hit.object.userData.renderOnly));
    f.root.visible = false; batch.render(() => assert.equal(batch.groups[0].batch.visible, false));
});
test('renderer failure restores authored meshes and animated NPCs are excluded', () => {
    const f = fixture(), batch = new StaticInstances(f.scene, [f.root]);
    assert.throws(() => batch.render(() => { throw Error('render failed'); }), /render failed/);
    assert(f.meshes.every(mesh => mesh.visible));
    f.root.name = 'moa-character';
    assert.equal(new StaticInstances(f.scene, [f.root]).groups.length, 0);
});
test('render LOD restores original geometry and visibility after render failure', () => {
    const f = fixture(), source = f.meshes[0], proxy = new Mesh(new BoxGeometry(), source.material);
    f.scene.add(proxy); proxy.visible = false;
    const lod = new StaticRenderLod(f.scene); lod.parts.push({ source, proxy });
    const geometry = source.geometry;
    assert.throws(() => lod.render(() => {
        assert.equal(source.visible, false); assert.equal(proxy.visible, true);
        assert.equal(source.geometry, geometry); throw Error('render failed');
    }), /render failed/);
    assert.equal(source.visible, true); assert.equal(proxy.visible, false);
    source.visible = false; lod.render(() => assert.equal(proxy.visible, false));
});
