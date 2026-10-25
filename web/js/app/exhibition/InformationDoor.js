import { Box3, Group, Vector3, MathUtils, Mesh, Matrix4, MeshBasicMaterial, DoubleSide } from '../../../vendor/three/three.module.js';

export function createInformationDoor(building) {
    if (building.informationDoor) return building.informationDoor;
    const panel = building.getObjectByName('Central_Wood_Door');
    if (!panel) throw new Error('안내소 문을 찾지 못했어요.');
    building.updateMatrixWorld(true);
    const box = new Box3().setFromObject(panel), center = box.getCenter(new Vector3());
    const scale = building.getWorldScale(new Vector3());
    const inside = new Mesh(panel.geometry,
        new MeshBasicMaterial({ color: 0x000000, side: DoubleSide, toneMapped: false }));
    inside.name = 'information-door-dark-interior';
    new Matrix4().copy(building.matrixWorld).invert().multiply(panel.matrixWorld)
        .decompose(inside.position, inside.quaternion, inside.scale);
    inside.position.z -= .2 / scale.z;
    inside.visible = false; building.add(inside);
    const pivot = new Group(); pivot.name = 'information-opening-door';
    pivot.position.copy(building.worldToLocal(new Vector3(box.min.x, box.min.y, center.z)));
    building.add(pivot);
    const parts = [];
    building.traverse(part => {
        if (part.isMesh && (part === panel || /^Door_(Brass_Hinge|Continuous_Panel_Moulding|Recessed_Panel)/.test(part.name) || part.name === 'Brass_Handle')) parts.push(part);
    });
    for (const part of parts) { part.userData.dynamicDoor = true; pivot.attach(part); }
    const animate = (target, duration = .55) => new Promise(resolve => {
        const start = pivot.rotation.y; let elapsed = 0, previous;
        const tick = now => {
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; elapsed += dt;
            const t = Math.min(elapsed / duration, 1), eased = t * t * (3 - 2 * t);
            pivot.rotation.y = MathUtils.lerp(start, target, eased);
            inside.visible = Math.abs(pivot.rotation.y) > .001;
            if (t === 1) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
    building.informationDoor = { center, floorY: box.min.y, open: () => animate(-Math.PI * .48), close: () => animate(0) };
    return building.informationDoor;
}
