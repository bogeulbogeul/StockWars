import * as THREE from '../vendor/three/three.module.js';
import {GROUND_PROJECTION as P} from '../js/data/townModelBuildings.js';
import {PLAYER_BODY_RADIUS as R} from '../js/components/town3d/CharacterBodies.js';
export async function checkBusStop(app){
    await app.scenes.ready;
    const s=app.scenes.townModelScene,stop=s.scene.getObjectByName('village_bus_stop');
    const result=[];
    stop.traverse(o=>{if(o.isMesh){const b=new THREE.Box3().setFromObject(o);result.push({name:o.name,min:b.min.toArray(),max:b.max.toArray()});}});
    const seat=new THREE.Box3().setFromObject(stop.getObjectByName('Bench_Seat'));
    const c=s.town.playerController;
    c.charPosX=seat.min.x+R+12;c.charPosY=(seat.max.z+R+8)*P;
    s.player.previous={x:c.charPosX,z:c.charPosY/P};
    s.player.setState('idle');s.busSeat.update();s.player.update(0);
    if(!c.canStand(c.charPosX,c.charPosY))throw Error('Seat approach remains blocked');
    const before={x:c.charPosX,y:c.charPosY,height:s.player.root.position.y};
    if(Math.abs(before.height-s.busSeat.platform.max.y)>.01)throw Error('Platform feet are buried');
    s.__seatBaseline=['LegL','LegR'].map(name=>{
        const bone=s.player.variants.get('walk').model.getObjectByName(name)||s.player.variants.get('walk').model.getObjectByName(name.replace('L','.L').replace('R','.R'));
        return {name,position:bone.position.toArray(),rotation:bone.quaternion.toArray()};
    });
    return {platform:s.busSeat.platform.max.y,seatTop:seat.max.y,before};
}

export function standingSnapshot(app){
    const s=app.scenes.townModelScene,c=s.town.playerController;
    if(c.busSeated||!c.canStand(c.charPosX,c.charPosY))throw Error('No legal standing exit');
    for(const saved of s.__seatBaseline){
        const bone=s.player.variants.get('walk').model.getObjectByName(saved.name)||s.player.variants.get('walk').model.getObjectByName(saved.name.replace('L','.L').replace('R','.R'));
        const values=[...bone.position.toArray(),...bone.quaternion.toArray()];
        const expected=[...saved.position,...saved.rotation];
        if(values.some((v,i)=>Math.abs(v-expected[i])>1e-6))throw Error('Leg pose not restored');
    }
    return true;
}

export function preparePlatformJump(app){
    const s=app.scenes.townModelScene,c=s.town.playerController;
    c.charPosX=(s.busSeat.bounds.min.x+s.busSeat.bounds.max.x)/2;
    c.charPosY=(s.busSeat.bounds.max.z+R+8)*P;
    s.player.previous={x:c.charPosX,z:c.charPosY/P};s.player.setState('idle');s.player.update(0);
    if(!c.canJumpAt(c.charPosX,c.charPosY))throw Error('Platform jump is unexpectedly blocked');
    return s.busSeat.platform.max.y;
}

export function seatedSnapshot(app){
    const s=app.scenes.townModelScene,c=s.town.playerController;
    if(!c.busSeated||s.busSeat.state!=='seated')throw Error('E did not seat the player');
    const bounds=s.busSeat.bounds,point=new THREE.Vector3();let under=Infinity,otherIntersections=0;
    const obstacles=[];
    s.scene.getObjectByName('village_bus_stop').traverse(mesh=>{
        if(mesh.isMesh&&/Smooth_Back_Plank|Side_Rail|Post|Bench_Leg|Bench_Lower_Beam|Front_Header|Header_Knee_Brace/.test(mesh.name))obstacles.push(new THREE.Box3().setFromObject(mesh));
    });
    s.player.root.updateMatrixWorld(true);
    s.player.variants.get('walk').model.traverse(mesh=>{
        if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();
        for(let i=0;i<mesh.geometry.attributes.position.count;i++){
            mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);
            if(point.x>=bounds.min.x&&point.x<=bounds.max.x&&point.z>=bounds.min.z&&point.z<=bounds.max.z)under=Math.min(under,point.y);
            if(obstacles.some(b=>point.x>b.min.x+.1&&point.x<b.max.x-.1&&point.y>b.min.y+.1&&point.y<b.max.y-.1&&point.z>b.min.z+.1&&point.z<b.max.z-.1))otherIntersections++;
        }
    });
    if(!Number.isFinite(under)||under<bounds.max.y-.01)throw Error('Seated body crosses seat top');
    if(otherIntersections)throw Error('Seated body intersects shelter structures');
    return {state:s.busSeat.state,x:c.charPosX,y:c.charPosY,rootHeight:s.player.root.position.y,seatTop:bounds.max.y,underside:under,otherIntersections};
}
