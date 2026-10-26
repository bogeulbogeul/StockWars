import { Vector3, Quaternion, MathUtils } from '../../../vendor/three/three.module.js';

// A stable three-person shot, with the seated teller's authored pose untouched.
export function createBankConversationCamera(room) {
    const basePosition = new Vector3(), baseRotation = new Quaternion();
    const shot = new Vector3(), target = new Vector3(), shotRotation = new Quaternion();
    let blend = 0, initialized = false;
    return {
        setBase(camera) { basePosition.copy(camera.position); baseRotation.copy(camera.quaternion); initialized = true; },
        update(camera, player, dt, active) {
            const moa = room.userData.moa, chagok = room.userData.chagok;
            if (!initialized) this.setBase(camera);
            const talking = active && player?.storyTarget === chagok && !player.town.playerController.scriptedWalking;
            blend = MathUtils.clamp(blend + (talking ? 1 : -1) * Math.min(dt || 0, .05) / .85, 0, 1);
            if (!blend || !moa || !chagok) {
                camera.position.copy(basePosition); camera.quaternion.copy(baseRotation); return;
            }
            if (talking) {
                target.addVectors(player.root.position, moa.root.position).add(chagok.position).multiplyScalar(1 / 3);
                target.y = 45;
                const distance = Math.max(730, 440 / Math.max(camera.aspect, .5));
                shot.copy(target).add(new Vector3(-.55, .36, .84).normalize().multiplyScalar(distance));
                camera.position.copy(shot); camera.lookAt(target); shotRotation.copy(camera.quaternion);
            }
            const eased = blend * blend * (3 - 2 * blend);
            camera.position.lerpVectors(basePosition, shot, eased);
            camera.quaternion.slerpQuaternions(baseRotation, shotRotation, eased);
        }
    };
}
