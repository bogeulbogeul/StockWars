import { Vector3 } from '../../../vendor/three/three.module.js';
import { walkRoomTo, walkRoute } from '../OnFootNavigation.js';
import { guideRouteTo } from '../../components/store3d/BongbongWorkstationGuide.js';
import { bongbongWalkAction } from '../../components/store3d/BongbongWalk.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';

// Bring the handoff into open floor space instead of sending the item through
// the worktop, paper roll or checkout. Both actors walk to their marks.
export async function stageStoreRewardConversation(room) {
    if (room.rewardConversationStaged) return;
    await walkRoomTo(room, { x: 85, z: 140 });
    const root = room.shopkeeper;
    const route = guideRouteTo(room, { x: -75, z: 130 });
    const action = bongbongWalkAction(root, room.player), mixer = root.userData.greetingMixer;
    action.reset().play(); room.controller.scriptedWalking = true; room.controller.isMoving = false;
    try {
        await walkRoute(route, (point, ahead, dt) => {
            root.position.copy(root.parent.worldToLocal(new Vector3(point.x, 0, point.y / P)));
            const dx = ahead.x - point.x, dz = (ahead.y - point.y) / P;
            if (Math.hypot(dx, dz) > .01) {
                const yaw = Math.atan2(dx, dz), delta = Math.atan2(Math.sin(yaw-root.rotation.y),Math.cos(yaw-root.rotation.y));
                root.rotation.y += Math.max(-4*dt, Math.min(4*dt,delta));
            }
            mixer.update(dt);
        }, 135);
        room.rewardConversationStaged = true;
    } finally { action.stop(); room.controller.scriptedWalking = false; room.controller.isMoving = false; }
}
