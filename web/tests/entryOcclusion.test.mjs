import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshBasicMaterial, PerspectiveCamera } from '../vendor/three/three.module.js';
import { createDialogueOcclusion } from '../js/components/town3d/DialogueOcclusion.js';

test('entry hides foreground trees while preserving the building and restores afterward', () => {
    const scene = new Group(), actor = { root: new Group() };
    scene.add(actor.root);
    const roots = [true, false].map((tree, i) => {
        const root = new Group(); root.userData.dialogueOccluder = true; root.userData.entryOccluder = tree;
        const mesh = new Mesh(new BoxGeometry(180, 180, 12), new MeshBasicMaterial());
        mesh.position.set(0, 80, 200 - i * 70); root.add(mesh); scene.add(root); return { root, mesh };
    });
    const camera = new PerspectiveCamera(45, 1.6, 1, 2000);
    camera.position.set(0, 130, 400); camera.lookAt(0, 60, 0); camera.updateMatrixWorld(true);
    const occlusion = createDialogueOcclusion(scene);
    occlusion.update(camera, [actor], { includeRoot: root => root.userData.entryOccluder });
    assert.equal(roots[0].mesh.visible, false); assert.equal(roots[1].mesh.visible, true);
    occlusion.reset(); assert(roots.every(item => item.mesh.visible));
});
