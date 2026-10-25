import { Box3, MathUtils, Vector3 } from '../../../vendor/three/three.module.js';
import { seatMoaOnBench } from './MoaBenchPose.js';

const smooth = (a, b, t) => MathUtils.smoothstep(t, a, b);
export function createMoaSeatMotion(moa, stop) {
    const legs = ['LegL', 'LegR'].map(name => moa.root.getObjectByName(name));
    if (legs.some(bone => !bone)) throw new Error('Moa stand: missing whole-leg bones');
    const standing = legs.map(bone => ({ position: bone.position.clone(), rotation: bone.quaternion.clone() }));
    const platform = new Box3().setFromObject(stop.getObjectByName('Smooth_Stone_Platform'));
    const seat = new Box3().setFromObject(stop.getObjectByName('Bench_Seat'));
    const floor = platform.max.y;
    seatMoaOnBench(moa, stop);
    const origin = moa.root.position.clone();
    const seated = legs.map(bone => ({ position: bone.position.clone(), rotation: bone.quaternion.clone() }));
    // Stand on the open platform, beyond the seat front and beside Somangi.
    const destination = new Vector3(origin.x, floor, seat.max.z + 44);
    moa.standDestination = destination.clone();
    let elapsed = 0, moving = false, resolve;
    function apply(t) {
        const unfold = smooth(.35, 1, t);
        moa.root.position.copy(origin);
        moa.root.position.z = MathUtils.lerp(origin.z, destination.z, smooth(0, .75, t));
        moa.root.position.y = MathUtils.lerp(origin.y, destination.y, unfold) + 3 * Math.sin(Math.PI * t);
        legs.forEach((bone, i) => {
            bone.position.lerpVectors(seated[i].position, standing[i].position, unfold);
            bone.quaternion.slerpQuaternions(seated[i].rotation, standing[i].rotation, unfold);
        });
        moa.root.updateMatrixWorld(true);
    }
    return {
        stand(immediate = false) {
            if (!moa.root.userData.seated && !moving) return Promise.resolve();
            if (moving && !immediate) return moa.standReady;
            if (immediate) { apply(1); moving = false; moa.root.userData.seated = false; resolve?.(); return Promise.resolve(); }
            elapsed = 0; moving = true;
            moa.standReady = new Promise(done => { resolve = done; });
            return moa.standReady;
        },
        sit() {
            moving = false; resolve?.(); apply(0); moa.root.userData.seated = true;
        },
        update(dt) {
            if (!moving) return;
            elapsed += Math.min(Math.max(dt || 0, 0), .1);
            const t = Math.min(elapsed / 1.15, 1); apply(t);
            if (t === 1) { moving = false; moa.root.userData.seated = false; resolve?.(); }
        }
    };
}
