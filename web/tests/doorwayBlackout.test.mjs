import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, Shape, Path, ShapeGeometry, MeshBasicMaterial, BoxGeometry, Raycaster, Vector3 } from '../vendor/three/three.module.js';
import { createDoorwayBlackout } from '../js/components/town3d/DoorwayBlackout.js';

test('blackout fills a real window hole and remains opaque and depth tested', () => {
    const building = new Group(), shape = new Shape();
    shape.moveTo(-1, 0); shape.lineTo(1, 0); shape.lineTo(1, 3); shape.lineTo(-1, 3); shape.closePath();
    const hole = new Path(); hole.moveTo(-.4, 1); hole.lineTo(-.4, 2); hole.lineTo(.4, 2); hole.lineTo(.4, 1); hole.closePath();
    shape.holes.push(hole);
    const leaf = new Mesh(new ShapeGeometry(shape), new MeshBasicMaterial()); building.add(leaf);
    const ray = new Raycaster(new Vector3(0, 1.5, 5), new Vector3(0, 0, -1));
    building.updateMatrixWorld(true);
    assert.equal(ray.intersectObject(leaf).length, 0);
    const mask = createDoorwayBlackout(building, [leaf], { name: 'window-mask' });
    building.updateMatrixWorld(true);
    assert(ray.intersectObject(mask).length > 0);
    assert.equal(mask.material.color.getHex(), 0);
    assert.equal(mask.material.transparent, false);
    assert.equal(mask.material.depthTest, true);
    assert.equal(mask.material.fog, false);
    assert.equal(mask.visible, false);
});

test('one silhouette fills the seam between double doors without covering the frame', () => {
    const building = new Group(), leaves = [-.52, .52].map(x => {
        const mesh = new Mesh(new BoxGeometry(1, 2, .05), new MeshBasicMaterial());
        mesh.position.set(x, 1, 0); building.add(mesh); return mesh;
    });
    const mask = createDoorwayBlackout(building, leaves, { name: 'double-mask' });
    building.updateMatrixWorld(true);
    const hit = x => new Raycaster(new Vector3(x, 1, 5), new Vector3(0, 0, -1)).intersectObject(mask);
    assert(hit(0).length > 0);
    assert.equal(hit(1.1).length, 0);
});
