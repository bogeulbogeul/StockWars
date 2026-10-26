import {seatMoaOnBench} from './MoaBenchPose.js';

export function createBusStopSeatPose(player,stop,x){
    const model=player.variants.get('walk').model;
    player.setState('idle');
    const bones=['LegL','LegR'].map(name=>model.getObjectByName(name)||model.getObjectByName(name.replace('L','.L').replace('R','.R')));
    if(bones.some(bone=>!bone))return null;
    const saved=bones.map(bone=>({position:bone.position.clone(),rotation:bone.quaternion.clone()}));
    player.storyCamera=null;player.storyTarget=null;
    player.root.position.set(x,0,0);player.root.rotation.y=0;
    seatMoaOnBench(player,stop,{modelRoot:model,forwardOffset:20});
    return ()=>{
        bones.forEach((bone,i)=>{bone.position.copy(saved[i].position);bone.quaternion.copy(saved[i].rotation);});
        player.root.userData.seated=false;
        delete player.root.userData.seatTop;
        player.root.updateMatrixWorld(true);
    };
}
