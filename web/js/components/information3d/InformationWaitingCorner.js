import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';

// Adopt the previously composed waiting corner. Coordinates are converted from
// its Blender Z-up layout into the room's Y-up game units.
export async function addInformationWaitingCorner(room) {
    const loader = new GLTFLoader();
    const placements = [
        ['Waiting-sage-sofa.glb', 'information-waiting-sofa', 320, 0, 138, -Math.PI / 2, 1],
        // Keep the waiting table closer to the sofa, as requested.
        ['Round-sage-rug.glb', 'information-waiting-rug', 142, 0, 138, 0, 1.05],
        ['Waiting-round-table.glb', 'information-waiting-table', 142, 2.7, 138, 0, 1],
        ['Small-potted-plant-v2.glb', 'information-waiting-plant', 142, 45.7, 138, 0, .65]
    ];
    return Promise.all(placements.map(async ([file, name, x, y, z, angle, scale]) => {
        const url = new URL(`../../../assets/office/3d/waiting-v1/${file}`, import.meta.url).href;
        const { scene } = await loader.loadAsync(url);
        scene.name = name; scene.position.set(x, y, z);
        scene.rotation.y = angle; scene.scale.setScalar(100 * scale);
        let seat = 0;
        const throwPillows = [];
        scene.traverse(object => {
            if (!object.isMesh) return;
            if (name === 'information-waiting-sofa' && /^(Cream|Gingham)_Pillow$/.test(object.name)) {
                throwPillows.push(object); return;
            }
            object.castShadow = name !== 'information-waiting-rug'; object.receiveShadow = true;
            if (/^Seat_Cushion(?:\.?\d+)?$/.test(object.name)) {
                object.name = `Information_Waiting_Seat_${++seat}`;
            }
        });
        throwPillows.forEach(object => object.removeFromParent());
        room.add(scene); return scene;
    }));
}
