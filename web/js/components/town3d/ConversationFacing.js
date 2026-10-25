import { Vector3, Quaternion, MathUtils } from '../../../vendor/three/three.module.js';

const point = new Vector3();
const seatedHeads = new WeakMap();
export function faceConversationPartner(root, target) {
    if (!root || !target || root.userData.sleeping) return;
    const yaw = conversationYaw(root, target);
    if (yaw === null) return;
    if (!root.userData.seated) { root.rotation.y = yaw; return; }
    // Preserve the adopted sitting pose and chair contact; only turn the head.
    let gaze = seatedHeads.get(root);
    if (!gaze) {
        const head = root.getObjectByName('Head');
        // Baked seated assets have no separate head bone. Rotate around the
        // existing seat anchor without changing their pose or contact height.
        if (!head) { root.rotation.y = yaw; return; }
        gaze = { head, rest: head.quaternion.clone() }; seatedHeads.set(root, gaze);
    }
    const delta = Math.atan2(Math.sin(yaw - root.rotation.y), Math.cos(yaw - root.rotation.y));
    const parentRotation = gaze.head.parent.getWorldQuaternion(new Quaternion());
    const axis = new Vector3(0, 1, 0).applyQuaternion(parentRotation.invert());
    gaze.head.quaternion.copy(gaze.rest).premultiply(new Quaternion().setFromAxisAngle(axis, MathUtils.clamp(delta, -1.2, 1.2)));
}
export function conversationYaw(root, target) {
    if (!target) return null;
    target.getWorldPosition(point);
    root.parent?.worldToLocal(point);
    const x = point.x - root.position.x, z = point.z - root.position.z;
    if (Math.hypot(x, z) <= .01) return null;
    const yaw = Math.atan2(x, z);
    const camera = root.userData.conversationOpenCamera;
    if (!camera) return yaw;
    if (camera.userData.plazaViewpoint) point.copy(camera.userData.plazaViewpoint);
    else camera.getWorldPosition(point);
    root.parent?.worldToLocal(point);
    const towardCamera = Math.atan2(point.x - root.position.x, point.z - root.position.z);
    const delta = Math.atan2(Math.sin(towardCamera - yaw), Math.cos(towardCamera - yaw));
    return yaw + delta * .7;
}
export function faceConversation(player, resident) {
    const root = resident?.root || resident;
    if (!player?.root || !root) return;
    player.faceTarget(root);
    if (resident.faceTarget) resident.faceTarget(player.root);
    else faceConversationPartner(root, player.root);
}
export function clearConversationFacing(player, resident) {
    if (player?.storyTarget && player.storyTarget === resident?.root) player.faceTarget(null);
    if (resident?.conversationTarget && resident.conversationTarget === player?.root) resident.faceTarget(null);
}
