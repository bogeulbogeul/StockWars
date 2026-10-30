import { Vector3 } from '../../../vendor/three/three.module.js';

const forward = new Vector3();
export function somangiFacingYaw(root) {
    forward.set(0, 0, 1).applyQuaternion(root.quaternion);
    return Math.atan2(forward.x, forward.z);
}

export function setSomangiFacing(root, yaw) {
    // Quaternion restoration can represent a Y turn as X/Z = PI in XYZ Euler.
    // Replacing only Y then reverses the actual facing. Walking is always upright.
    root.rotation.set(0, yaw, 0);
}

export function turnUprightFacing(root, targetYaw, maxStep) {
    const current = somangiFacingYaw(root);
    const delta = Math.atan2(Math.sin(targetYaw - current), Math.cos(targetYaw - current));
    setSomangiFacing(root, current + Math.max(-maxStep, Math.min(maxStep, delta)));
}

export { somangiFacingYaw as uprightFacingYaw, setSomangiFacing as setUprightFacing };
