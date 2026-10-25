import { conversationYaw } from './ConversationFacing.js';
import { MathUtils, Quaternion, Vector3 } from '../../../vendor/three/three.module.js';
import { createSleepEffect } from './SleepEffect.js';
import { createMoaSeatMotion } from './MoaSeatMotion.js';
import { MoaCharacter } from './MoaCharacter.js';
import { MOA_TOWN_POSITION } from '../../data/moaModels.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';

// Current unclothed model: a local head nod, independent of leaf animation.
export async function addSleepingAnna(scene, stop) {
    const moa = new MoaCharacter(scene, { x: MOA_TOWN_POSITION.x, z: MOA_TOWN_POSITION.y / GROUND_PROJECTION });
    await moa.ready;
    const seatMotion = createMoaSeatMotion(moa, stop);
    const sleepEffect = createSleepEffect(moa.root);
    moa.setSleepEffectEnabled = enabled => sleepEffect.setEnabled(enabled);
    const head = moa.root.getObjectByName('Head');
    const rest = head?.quaternion.clone();
    const nod = new Quaternion(), axis = new Vector3(1, 0, 0);
    const turn = new Quaternion(), up = new Vector3(0, 1, 0);
    const update = moa.update.bind(moa);
    const faceTarget = moa.faceTarget.bind(moa);
    let sleeping = true, time = 0;
    // Calls made while dreaming must not register a conversation gaze target.
    moa.faceTarget = target => faceTarget(sleeping ? null : target);
    moa.setAwake = (awake, { immediate = false } = {}) => {
        const wasSleeping = sleeping;
        sleeping = !awake;
        if (awake) moa.standReady = seatMotion.stand(immediate || matchMedia('(prefers-reduced-motion: reduce)').matches);
        else {
            moa.faceTarget(null); moa.root.rotation.y = 0;
            if (!wasSleeping) seatMotion.sit();
        }
        sleepEffect.setSleeping(sleeping);
        moa.root.userData.sleeping = sleeping;
        if (head) head.quaternion.copy(rest);
        return moa.setMood(awake ? 'happy' : 'calm', awake ? 'smile' : 'sleepy');
    };
    moa.update = dt => {
        update(dt);
        seatMotion.update(dt);
        sleepEffect.update(dt);
        time += Math.min(Math.max(dt || 0, 0), .1);
        if (head) {
            head.quaternion.copy(rest);
            const yaw = !sleeping && moa.root.userData.seated ? conversationYaw(moa.root, moa.conversationTarget) : null;
            if (yaw !== null) {
                const local = Math.atan2(Math.sin(yaw - moa.root.rotation.y), Math.cos(yaw - moa.root.rotation.y));
                head.quaternion.multiply(turn.setFromAxisAngle(up, MathUtils.clamp(local, -.55, .55)));
            }
            if (sleeping) {
                const dip = (1 + Math.sin(time * 1.7)) / 2;
                head.quaternion.multiply(nod.setFromAxisAngle(axis, .12 + .16 * dip * dip));
            }
        }
    };
    await moa.setAwake(false);
    return moa;
}
