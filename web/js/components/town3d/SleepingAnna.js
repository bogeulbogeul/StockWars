import { Quaternion, Vector3 } from '../../../vendor/three/three.module.js';
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
    const head = moa.root.getObjectByName('Head');
    const rest = head?.quaternion.clone();
    const nod = new Quaternion(), axis = new Vector3(1, 0, 0);
    const update = moa.update.bind(moa);
    let sleeping = true, time = 0;
    moa.setAwake = (awake, { immediate = false } = {}) => {
        const wasSleeping = sleeping;
        sleeping = !awake;
        if (awake) moa.standReady = seatMotion.stand(immediate || matchMedia('(prefers-reduced-motion: reduce)').matches);
        else if (!wasSleeping) seatMotion.sit();
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
        if (head && sleeping) {
            const dip = (1 + Math.sin(time * 1.7)) / 2;
            head.quaternion.copy(rest).multiply(nod.setFromAxisAngle(axis, .12 + .16 * dip * dip));
        }
    };
    await moa.setAwake(false);
    return moa;
}
