import { Vector3, Quaternion, MathUtils } from '../../../vendor/three/three.module.js';

// Frame the speakers without changing their conversation-facing direction.
// Normal movement restores the follow camera.
export function createConversationCamera({ fitWidth = false, worldCoordinates = false, faceFraming = false } = {}) {
    let blend = 0, wasActive = false, sideSign = 1;
    let baseFov, shotFov;
    const center = new Vector3(), axis = new Vector3(), side = new Vector3();
    const normal = new Vector3(), shotPosition = new Vector3();
    const rotation = new Quaternion(), shotRotation = new Quaternion();
    const playerPosition = new Vector3(), residentPosition = new Vector3();
    return {
        reset(camera) {
            blend = 0; wasActive = false;
            if (faceFraming && baseFov !== undefined) {
                camera.fov = baseFov; camera.updateProjectionMatrix();
            }
        },
        update(camera, player, moa, dt) {
            baseFov ??= camera.fov; shotFov ??= baseFov;
            const plaza = !!player?.root.userData.plazaConversation;
            const active = player?.storyTarget === moa?.root && !moa?.root.userData.sleeping
                && (!moa?.root.userData.seated || plaza) && !player.town.playerController.scriptedWalking;
            const duration = active ? .8 : 1.1;
            blend = MathUtils.clamp(blend + (active ? 1 : -1) * Math.min(dt || 0, .05) / duration, 0, 1);
            if (!blend && faceFraming) { camera.fov = baseFov; camera.updateProjectionMatrix(); }
            if (!blend || !player?.root || !moa?.root) { wasActive = active; return; }
            normal.copy(camera.position); rotation.copy(camera.quaternion);
            if (active) {
                if (worldCoordinates) {
                    player.root.getWorldPosition(playerPosition); moa.root.getWorldPosition(residentPosition);
                } else { playerPosition.copy(player.root.position); residentPosition.copy(moa.root.position); }
                center.addVectors(playerPosition, residentPosition).multiplyScalar(.5);
                center.y += faceFraming ? 78 : 60;
                axis.subVectors(residentPosition, playerPosition); axis.y = 0; axis.normalize();
                side.set(-axis.z, 0, axis.x);
                if (!wasActive) sideSign = side.z < 0 ? -1 : 1;
                side.multiplyScalar(sideSign);
                if (plaza && moa.root.userData.seated) {
                    side.x += Math.sin(moa.root.rotation.y) * .8;
                    side.z += Math.cos(moa.root.rotation.y) * .8;
                    side.normalize();
                }
                let distance = fitWidth ? Math.max(520, (playerPosition.distanceTo(residentPosition) + 90)
                    / (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2) * camera.aspect) * 1.15) : 520;
                if (faceFraming) {
                    // A closer lens sees the inward-facing front of each actor,
                    // rather than viewing two parallel profiles from far away.
                    shotFov = MathUtils.clamp(MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(61)) / camera.aspect)), 40, 105);
                    distance = Math.max(130, (playerPosition.distanceTo(residentPosition) / 2 + 70)
                        / (Math.tan(MathUtils.degToRad(shotFov / 2)) * camera.aspect) * 1.35);
                    if (plaza) {
                        shotFov = 45;
                        distance = Math.max(550, (playerPosition.distanceTo(residentPosition) + 160)
                            / (2 * Math.tan(MathUtils.degToRad(shotFov / 2)) * camera.aspect) * 1.25);
                    }
                }
                shotPosition.copy(center).addScaledVector(side, distance); shotPosition.y += plaza ? 150 : faceFraming ? 42 : 170;
                if (plaza) {
                    camera.userData.plazaViewpoint ||= new Vector3();
                    camera.userData.plazaViewpoint.copy(shotPosition);
                }
                camera.position.copy(shotPosition); camera.lookAt(center);
                shotRotation.copy(camera.quaternion);
            }
            // Departing actors must not move or flip the shot during its exit.
            const eased = blend * blend * (3 - 2 * blend);
            camera.position.lerpVectors(normal, shotPosition, eased);
            camera.quaternion.slerpQuaternions(rotation, shotRotation, eased);
            if (faceFraming) {
                camera.fov = MathUtils.lerp(baseFov, shotFov, eased); camera.updateProjectionMatrix();
            }
            wasActive = active;
        }
    };
}
