import { MathUtils } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { animate } from './HandoffMotion.js';
import { somangiFacingYaw, setSomangiFacing } from '../../components/town3d/SomangiFacing.js';

// Blend the actual seated pose into the existing legal standing exit instead
// of making SeatInteraction.stand's position change visible as a jump.
export async function dismountPlayerSeat(room) {
    const seats = room.seatInteraction, player = room.player, c = room.controller;
    if (!seats?.selected) return;
    const root = player.root, model = player.variants.get('walk').model;
    const bones = [];
    model.traverse(bone => { if (bone.isBone) bones.push(bone); });
    const seated = bones.map(bone => ({ position: bone.position.clone(), rotation: bone.quaternion.clone() }));
    const origin = root.position.clone(), yaw = somangiFacingYaw(root);
    if (!seats.stand()) throw new Error('의자에서 내려올 공간을 찾지 못했어요.');
    const destination = root.position.clone();
    const standing = bones.map(bone => ({ position: bone.position.clone(), rotation: bone.quaternion.clone() }));
    root.position.copy(origin); setSomangiFacing(root, yaw);
    bones.forEach((bone, i) => { bone.position.copy(seated[i].position); bone.quaternion.copy(seated[i].rotation); });
    c.busSeated = true; c.isResting = true; c.scriptedWalking = true; c.isMoving = false; c.keysHeld.clear();
    root.userData.seated = true;
    room.playerDismounting = true;
    try {
        await animate(1.05, t => {
            const slide = MathUtils.smoothstep(t, 0, .8), lower = MathUtils.smoothstep(t, .2, 1);
            root.position.lerpVectors(origin, destination, slide);
            root.position.y = MathUtils.lerp(origin.y, destination.y, lower);
            const unfold = MathUtils.smoothstep(t, .15, .95);
            bones.forEach((bone, i) => {
                bone.position.lerpVectors(seated[i].position, standing[i].position, unfold);
                bone.quaternion.slerpQuaternions(seated[i].rotation, standing[i].rotation, unfold);
            });
            c.charPosX = root.position.x; c.charPosY = root.position.z * P;
            root.updateMatrixWorld(true);
        });
    } finally {
        root.position.copy(destination); setSomangiFacing(root, yaw);
        bones.forEach((bone, i) => { bone.position.copy(standing[i].position); bone.quaternion.copy(standing[i].rotation); });
        c.charPosX = destination.x; c.charPosY = destination.z * P;
        c.busSeated = false; c.isResting = false; c.scriptedWalking = false; c.isMoving = false;
        root.userData.seated = false; room.playerDismounting = false;
        player.holdFacing(); player.setState('idle');
    }
}
