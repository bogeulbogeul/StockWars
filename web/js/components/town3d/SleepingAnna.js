import { MoaCharacter } from './MoaCharacter.js';
import { MOA_TOWN_POSITION } from '../../data/moaModels.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';

// Standing model only: retired seated/dozing body animations are not restored.
export async function addSleepingAnna(scene) {
    const moa = new MoaCharacter(scene, { x: MOA_TOWN_POSITION.x, z: MOA_TOWN_POSITION.y / GROUND_PROJECTION });
    await moa.ready;
    moa.setAwake = awake => moa.setMood(awake ? 'happy' : 'calm', awake ? 'smile' : 'sleepy');
    return moa;
}
