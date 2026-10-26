import { Vector3, Vector2, Shape, ShapeGeometry, Mesh, MeshBasicMaterial, DoubleSide } from '../../../vendor/three/three.module.js';

// A single solid silhouette closes glass holes, panel recesses and double-door seams.
// Keep real depth testing so opening leaves and characters remain in front of it.
export function createDoorwayBlackout(building, panels, { name, frontParts = [] } = {}) {
    building.updateMatrixWorld(true);
    const inverse = building.matrixWorld.clone().invert(), point = new Vector3();
    const points = [];
    let front = -Infinity;
    const visit = (root, outline) => root.traverse(mesh => {
        const positions = mesh.geometry?.attributes.position;
        if (!positions) return;
        const matrix = inverse.clone().multiply(mesh.matrixWorld);
        for (let i = 0; i < positions.count; i++) {
            point.fromBufferAttribute(positions, i).applyMatrix4(matrix);
            if (outline) points.push(new Vector2(point.x, point.y));
            front = Math.max(front, point.z);
        }
    });
    panels.forEach(panel => visit(panel, true));
    frontParts.forEach(part => visit(part, false));
    points.sort((a, b) => a.x - b.x || a.y - b.y);
    const unique = points.filter((p, i) => !i || p.x !== points[i - 1].x || p.y !== points[i - 1].y);
    const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const half = ordered => {
        const hull = [];
        for (const p of ordered) {
            while (hull.length > 1 && cross(hull.at(-2), hull.at(-1), p) <= 0) hull.pop();
            hull.push(p);
        }
        return hull.slice(0, -1);
    };
    const hull = [...half(unique), ...half([...unique].reverse())];
    if (hull.length < 3) throw new Error(`출입구 윤곽을 찾지 못했어요: ${name}`);
    const mask = new Mesh(new ShapeGeometry(new Shape(hull)),
        new MeshBasicMaterial({ color: 0, side: DoubleSide, toneMapped: false, fog: false }));
    mask.name = name;
    // The tiny offset prevents coplanar details from showing through the blackout.
    mask.position.z = front + .001;
    mask.visible = false;
    mask.userData.dynamicDoor = true;
    building.add(mask);
    return mask;
}
