import { Vector3 } from '../../../vendor/three/three.module.js';

const point = new Vector3();
export function conversationYaw(root, target) {
    if (!target) return null;
    target.getWorldPosition(point);
    root.parent?.worldToLocal(point);
    const x = point.x - root.position.x, z = point.z - root.position.z;
    return Math.hypot(x, z) > .01 ? Math.atan2(x, z) : null;
}
export function faceConversation(player, resident) {
    if (!player?.root || !resident?.root) return;
    player.faceTarget(resident.root);
    resident.faceTarget(player.root);
}
export function clearConversationFacing(player, resident) {
    if (player?.storyTarget && player.storyTarget === resident?.root) player.faceTarget(null);
    if (resident?.conversationTarget && resident.conversationTarget === player?.root) resident.faceTarget(null);
}
