import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

const loader = new GLTFLoader();
const models = new Map();
async function load(name) {
    if (!models.has(name)) {
        const url = new URL(`../../../assets/office/3d/${name}.glb`,import.meta.url).href;
        models.set(name,loader.loadAsync(url));
    }
    return (await models.get(name)).scene.clone(true);
}

export async function addCozyFacilityDoor(room, door) {
    const [assembly,sign] = await Promise.all([
        load('Cipher-arched-double-door'),load(`Cipher-sign-${door.id}`)
    ]);
    const side = door.wall === 'left' ? -1 : 1;
    assembly.name = `door-${door.id}`;
    const frame = assembly.getObjectByName('Door_Frame');
    const panel = assembly.getObjectByName('Door_Leaf_Left');
    if (!frame || !panel) throw new Error('Invalid facility door model');
    frame.name = `door-${door.id}-frame`;
    panel.name = `door-${door.id}-panel`;
    sign.name = `door-${door.id}-sign`;
    sign.userData.label = door.label;
    for (const model of [assembly,sign]) {
        model.scale.setScalar(100);
        model.rotation.y = -side*Math.PI/2;
        model.position.set(side*LOBBY.width/2,model===sign ? 239 : 0,door.z);
        model.traverse(object => {
            if (!object.isMesh) return;
            object.castShadow = object.receiveShadow = true;
        });
        room.add(model);
    }
}
