import { Box3, Group, Vector3, Mesh, CylinderGeometry, MeshStandardMaterial } from '../../../vendor/three/three.module.js';
import { createDoorwayBlackout } from './DoorwayBlackout.js';

const clean = name => name.replace(/\./g, '');
const starts = (mesh, prefix) => clean(mesh.name).startsWith(prefix);
export const EXTERIOR_DOORS = {
    node_finance: { id: 'bank', leaves: ['Central_Double_Door_Leaf'], parts: /^(Brass_Door_Handle|Handle_Mount)/ },
    julian_furniture: { id: 'furniture', leaves: ['Entry_Double_Door_Leaf'], parts: /^(Brass_Door_Pull|Brass_Handle_Mount|Door_Inset_Glass|Door_Lower_Inset_Panel)/ },
    midnight_pub: { id: 'pub', leaves: ['Double_Arch_Door_Left', 'Double_Arch_Door_Right'], parts: /^(Brass_Door_Handle|Handle_Mount|Door_Blue_Glass|Door_Lower_Panel)/ },
    cipher_securities: { id: 'cipher', leaves: ['Reference_Door_Leaf_'], parts: /^(Reference_Door_(Recess|Vertical)|Reference_(Straight_Brass_Pull|Brass_Pull_Fixing)|Door_Brass_Hinge)/, hinge: 'Door_Brass_Hinge' },
    data_ink_bookstore: { id: 'bookstore', leaves: ['Arched_Wood_Entry'], parts: /^(Door_(Arched_Glass_Bead|Brass_Curved_Pull|Handle_Rosette|Hinge|Lower_)|Entry_Inset_Glass)/, hinge: 'Door_Hinge_Barrel', hingeGeometry: true },
    post_office: { id: 'post', leaves: ['Arched_Wood_Entry'], parts: /^(Door_(Arched_Glass_Bead|Brass_Curved_Pull|Handle_Rosette|Hinge|Lower_)|Entry_Inset_Glass)/, hinge: 'Door_Hinge_Barrel', hingeGeometry: true }
};

// Bounds in building space, including all nested authored transforms.
function localBounds(building, mesh) {
    const inverse = building.matrixWorld.clone().invert();
    const box = new Box3(), point = new Vector3();
    mesh.traverse(part => {
        const positions = part.geometry?.attributes.position;
        if (!positions) return;
        for (let i = 0; i < positions.count; i++) {
            point.fromBufferAttribute(positions, i).applyMatrix4(part.matrixWorld).applyMatrix4(inverse);
            box.expandByPoint(point);
        }
    });
    return box;
}

export function createExteriorDoor(building, definition = EXTERIOR_DOORS[building.name]) {
    if (!definition) return null;
    const { id } = definition, key = `${id}Door`;
    if (building[key]) return building[key];
    building.updateMatrixWorld(true);
    const leaves = [], parts = [], hinges = [];
    building.traverse(mesh => {
        if (!mesh.isMesh) return;
        if (definition.leaves.some(prefix => starts(mesh, prefix))) leaves.push(mesh);
        else if (definition.parts.test(mesh.name)) parts.push(mesh);
        if (definition.hinge && starts(mesh, definition.hinge)) hinges.push(mesh);
    });
    if (!leaves.length || (definition.hinge && !hinges.length)) throw new Error(`문/경첩 누락: ${building.name}`);
    const boxes = leaves.map(leaf => localBounds(building, leaf));
    const bounds = new Box3(); boxes.forEach(box => bounds.union(box));
    const middle = bounds.getCenter(new Vector3());
    const centers = boxes.map(box => box.getCenter(new Vector3()));
    const closest = point => centers.reduce((best, center, i) => Math.abs(point.x - center.x) < Math.abs(point.x - centers[best].x) ? i : best, 0);
    const dark = createDoorwayBlackout(building, leaves, {
        name: `${id}-door-dark-interior`, frontParts: parts.filter(mesh => /Glass/.test(mesh.name))
    });
    const panels = leaves.map((leaf, i) => {
        const box = boxes[i], left = centers[i].x < middle.x;
        const pins = hinges.filter(pin => closest(localBounds(building, pin).getCenter(new Vector3())) === i);
        let axis;
        if (pins.length) {
            const pin = pins[0];
            axis = definition.hingeGeometry ? localBounds(building, pin).getCenter(new Vector3())
                : building.worldToLocal(pin.getWorldPosition(new Vector3()));
        } else {
            // These assets have no hinge hardware. Add a visible pin at the jamb.
            axis = new Vector3(left ? box.min.x : box.max.x, box.min.y, box.max.z);
            const height = box.max.y - box.min.y, radius = height * .007;
            for (const fraction of [.23, .76]) {
                const pin = new Mesh(new CylinderGeometry(radius, radius, height * .055, 12),
                    new MeshStandardMaterial({ color: 0xb38b45, metalness: .65, roughness: .35 }));
                pin.name = `${id}-hinge-pin-${i}-${fraction}`;
                pin.position.set(axis.x, box.min.y + height * fraction, axis.z);
                pin.userData.dynamicDoor = true;
                building.add(pin); pins.push(pin);
            }
        }
        const pivot = new Group(); pivot.name = `${id}-opening-door-${i}`;
        pivot.position.copy(axis); building.add(pivot);
        const attached = parts.filter(mesh => closest(localBounds(building, mesh).getCenter(new Vector3())) === i);
        for (const mesh of new Set([leaf, ...attached, ...pins])) { mesh.userData.dynamicDoor = true; pivot.attach(mesh); }
        return { pivot, dark, pins, direction: axis.x < centers[i].x ? -1 : 1 };
    });
    const worldBox = new Box3(); leaves.forEach(leaf => worldBox.expandByObject(leaf));
    let target = 0, pending = Promise.resolve(), serial = 0;
    const move = value => {
        if (target === value) return pending;
        target = value;
        const version = ++serial, starts = panels.map(p => p.pivot.rotation.y);
        pending = new Promise(resolve => {
            let previous, elapsed = 0;
            const tick = now => {
                if (version !== serial) { resolve(); return; }
                elapsed += previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now;
                const t = Math.min(elapsed / .55, 1), ease = t * t * (3 - 2 * t);
                panels.forEach((p, i) => {
                    p.pivot.rotation.y = starts[i] + (value * p.direction - starts[i]) * ease;
                });
                dark.visible = panels.some(p => Math.abs(p.pivot.rotation.y) > .001);
                if (t === 1) resolve(); else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        return pending;
    };
    return building[key] = { center: worldBox.getCenter(new Vector3()), width: worldBox.max.x - worldBox.min.x,
        floorY: worldBox.min.y, approachDistance: 180, panels,
        get isOpen() { return target !== 0; }, open: () => Promise.resolve(), close: () => Promise.resolve() };
}

export class ExteriorDoorProximity {
    constructor(scene) { this.doors = Object.keys(EXTERIOR_DOORS).map(id => scene.getObjectByName(id)).filter(Boolean).map(b => createExteriorDoor(b)); }
    update() {}
}
