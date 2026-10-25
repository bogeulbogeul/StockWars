import { Vector3, Quaternion, MathUtils } from '../../../vendor/three/three.module.js';

// Open both faces toward the lens while keeping an inward conversational angle.
// Normal movement restores the follow camera.
export function createConversationCamera() {
    let blend = 0, wasActive = false, sideSign = 1;
    const center = new Vector3(), axis = new Vector3(), side = new Vector3();
    const normal = new Vector3(), shotPosition = new Vector3();
    const rotation = new Quaternion(), shotRotation = new Quaternion();
    return {
        update(camera, player, moa, dt) {
            const active = player?.storyTarget === moa?.root && !moa?.root.userData.sleeping
                && !moa?.root.userData.seated && !player.town.playerController.scriptedWalking;
            const duration = active ? .8 : 1.1;
            blend = MathUtils.clamp(blend + (active ? 1 : -1) * Math.min(dt || 0, .05) / duration, 0, 1);
            if (!blend || !player?.root || !moa?.root) { wasActive = active; return; }
            normal.copy(camera.position); rotation.copy(camera.quaternion);
            if (active) {
                center.addVectors(player.root.position, moa.root.position).multiplyScalar(.5);
                center.y += 60;
                axis.subVectors(moa.root.position, player.root.position); axis.y = 0; axis.normalize();
                side.set(-axis.z, 0, axis.x);
                if (!wasActive) sideSign = side.z < 0 ? -1 : 1;
                side.multiplyScalar(sideSign);
                shotPosition.copy(center).addScaledVector(side, 520); shotPosition.y += 170;
                camera.position.copy(shotPosition); camera.lookAt(center);
                shotRotation.copy(camera.quaternion);
            }
            // Departing actors must not move or flip the shot during its exit.
            const eased = blend * blend * (3 - 2 * blend);
            camera.position.lerpVectors(normal, shotPosition, eased);
            camera.quaternion.slerpQuaternions(rotation, shotRotation, eased);
            wasActive = active;
            if (active) for (const actor of [player.root, moa.root]) {
                const towardLens = Math.atan2(camera.position.x - actor.position.x, camera.position.z - actor.position.z);
                const turn = Math.atan2(Math.sin(towardLens - actor.rotation.y), Math.cos(towardLens - actor.rotation.y));
                // About 29 degrees from the lens shows both eyes and the mouth,
                // rather than stopping at a near-profile twenty-degree turn.
                actor.rotation.y += (turn - MathUtils.clamp(turn, -.5, .5)) * eased;
            }
        }
    };
}
