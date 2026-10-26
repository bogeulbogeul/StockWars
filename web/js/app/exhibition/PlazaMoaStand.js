import { Vector3 } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { townSeatSurfaces } from '../../components/town3d/SeatSurfaces.js';
import { animate } from './HandoffMotion.js';

export async function standPlazaMoa(scenes) {
    const moa = scenes.townModelScene.sleepingAnna, c = scenes.townStage.playerController;
    if (!moa.root.userData.seated || !scenes.moaPlazaRestore) return;
    const seat = townSeatSurfaces(scenes.townModelScene.scene).find(s => s.id === 'plaza_bench_west-0');
    if (!seat) return;
    const origin = moa.root.position.clone(), minimum = Math.min(85, Math.hypot(origin.x-c.charPosX,origin.z-c.charPosY/P));
    const right = new Vector3(seat.forward.z,0,-seat.forward.x);
    const destination = [0,100,-100,150,-150,200,-200].map(side =>
        seat.center.clone().addScaledVector(seat.forward,110).addScaledVector(right,side))
        .find(point => c.sceneryCanStand(point.x,point.z*P) && Array.from({length:16},(_,i)=>{
            const t=i/15; return Math.hypot(origin.x+(point.x-origin.x)*t-c.charPosX,
                origin.z+(point.z-origin.z)*t-c.charPosY/P)>=minimum-.01;
        }).every(Boolean));
    if (!destination) return;
    destination.y = c.supportHeightAt?.(destination.x,destination.z*P)||0;
    const bones=['LegL','LegR'].map(name=>moa.root.getObjectByName(name));
    const seated=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
    scenes.moaPlazaRestore(); scenes.moaPlazaRestore=null;
    const rest=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
    bones.forEach((b,i)=>{b.position.copy(seated[i].p);b.quaternion.copy(seated[i].q);});
    moa.root.userData.seated=true;moa.faceTarget(null);
    const scripted=c.scriptedWalking;c.scriptedWalking=true;c.isMoving=false;
    try { await animate(1.05,t=>{
        const unfold=Math.max(0,(t-.25)/.75);
        moa.root.position.lerpVectors(origin,destination,t);
        bones.forEach((b,i)=>{b.position.lerpVectors(seated[i].p,rest[i].p,unfold);b.quaternion.slerpQuaternions(seated[i].q,rest[i].q,unfold);});
    }); } finally { c.scriptedWalking=scripted;moa.root.userData.seated=false; }
    scenes.moaStandingAtPlaza=true;
}
