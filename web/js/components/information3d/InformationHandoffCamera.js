import { Vector3, Quaternion, MathUtils } from '../../../vendor/three/three.module.js';
import { faceConversationPartner } from '../town3d/ConversationFacing.js';

// A side two-shot across the counter; seated bodies and chair contact stay fixed.
export function createInformationHandoffCamera(room) {
    const base = new Vector3(), rotation = new Quaternion(), shot = new Vector3();
    const center = new Vector3(), playerPoint = new Vector3(), moaPoint = new Vector3();
    const shotRotation = new Quaternion();
    let initialized = false, blend = 0, heads = null, baseFov;
    return {
        setBase(camera) { base.copy(camera.position); rotation.copy(camera.quaternion); baseFov ??= camera.fov; initialized = true; },
        update(camera, player, dt) {
            if (!initialized) this.setBase(camera);
            const moa = room.userData.moa, active = !!room.userData.phoneHandoffActive;
            blend = MathUtils.clamp(blend + (active ? 1 : -1) * Math.min(dt || 0, .05) / .8, 0, 1);
            if (!player?.root || !moa?.root) return;
            if (blend) {
                heads ||= [player.root, moa.root].map(root => {
                    const head = root.getObjectByName('Head'); return { root, head, rest: head?.quaternion.clone() };
                });
                player.root.getWorldPosition(playerPoint); moa.root.getWorldPosition(moaPoint);
                center.addVectors(playerPoint, moaPoint).multiplyScalar(.5); center.y = 90;
                // Stay inside the side wall; widen the lens instead of backing through it.
                const distance = 360;
                shot.copy(center).add(new Vector3(distance, 145, 0));
                camera.position.copy(shot); camera.lookAt(center); shotRotation.copy(camera.quaternion);
                const eased = blend * blend * (3 - 2 * blend);
                camera.position.lerpVectors(base, shot, eased);
                camera.quaternion.slerpQuaternions(rotation, shotRotation, eased);
                const shotFov = MathUtils.clamp(MathUtils.radToDeg(2 * Math.atan(320 / (distance * camera.aspect))), 52, 100);
                camera.fov = MathUtils.lerp(baseFov, shotFov, eased); camera.updateProjectionMatrix();
                for (const { root } of heads) root.userData.conversationOpenCamera = camera;
                faceConversationPartner(player.root, moa.root);
                faceConversationPartner(moa.root, player.root);
            } else {
                camera.position.copy(base); camera.quaternion.copy(rotation);
                camera.fov = baseFov; camera.updateProjectionMatrix();
                if (heads) for (const { root, head, rest } of heads) {
                    root.userData.conversationOpenCamera = null;
                    if (head && rest) head.quaternion.copy(rest);
                }
                heads = null;
            }
        }
    };
}
