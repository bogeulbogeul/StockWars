import { Box3, Quaternion, Vector3 } from '../../../vendor/three/three.module.js';

// Pose the current whole-leg rig; do not load retired seated character assets.
export function seatMoaOnBench(moa, stop, {modelRoot=moa.root,forwardOffset=3,seat=stop?.getObjectByName('Bench_Seat')}={}) {
    if (!seat) return;
    const bounds = new Box3().setFromObject(seat);
    const center = bounds.getCenter(new Vector3());
    moa.root.position.z = center.z + forwardOffset;
    moa.root.updateMatrixWorld(true);
    const axis = new Vector3(1, 0, 0);
    for (const name of ['Leg.L', 'Leg.R']) {
        const bone = modelRoot.getObjectByName(name) || modelRoot.getObjectByName(name.replace('.', ''));
        if (!bone) throw new Error(`Moa seat: missing leg bone ${name}`);
        const parent = bone.parent.getWorldQuaternion(new Quaternion());
        const rotation = new Quaternion().setFromAxisAngle(axis, -Math.PI * .42);
        bone.quaternion.premultiply(parent.clone().invert().multiply(rotation).multiply(parent));
        // Keep the whole feet in front of the seat while the upper legs join the belly.
        const joint = bone.getWorldPosition(new Vector3()).add(new Vector3(0, 6, 10));
        bone.position.copy(bone.parent.worldToLocal(joint));
    }
    moa.root.updateMatrixWorld(true);
    let underside = Infinity;
    const vertex = new Vector3();
    modelRoot.traverse(mesh => {
        if (!mesh.isSkinnedMesh) return;
        mesh.skeleton.update();
        for (let i = 0; i < mesh.geometry.getAttribute('position').count; i++) {
            mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld);
            if (vertex.x < bounds.min.x || vertex.x > bounds.max.x
                || vertex.z < bounds.min.z || vertex.z > bounds.max.z) continue;
            underside = Math.min(underside, vertex.y);
        }
    });
    if (!Number.isFinite(underside)) throw new Error('Moa seat: missing body contact surface');
    moa.root.position.y += bounds.max.y - underside + .3;
    moa.root.userData.seated = true;
    moa.root.userData.seatTop = bounds.max.y;
    moa.root.updateMatrixWorld(true);
}
