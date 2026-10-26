import { Group } from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { INFORMATION_MODEL_URL } from '../../data/informationModelRoom.js';

// Reuse the adopted visitor stool, opposite Chagok across the bank counter.
export async function addBankVisitorSeat(room) {
    const { scene } = await new GLTFLoader().loadAsync(INFORMATION_MODEL_URL);
    const stool = new Group(); stool.name = 'bank-visitor-stool';
    stool.scale.setScalar(100); stool.position.y = -2.4;
    scene.traverse(mesh => {
        if (!mesh.isMesh || !/^(Round_Sage_Cushion|Round_Wood_Seat|Short_Rounded_Wood_Leg)(?:\.?\d+)?$/.test(mesh.name)) return;
        const clone = mesh.clone(false); clone.castShadow = clone.receiveShadow = true; stool.add(clone);
    });
    room.add(stool); return stool;
}
