import {Quaternion,Vector3} from '../../../vendor/three/three.module.js';

export function applySeatPose(player,seat){
    player.setState('idle');
    const model=player.variants.get('walk').model;
    const bones=['LegL','LegR'].map(n=>model.getObjectByName(n)||model.getObjectByName(n.replace('L','.L').replace('R','.R')));
    if(bones.some(b=>!b))return null;
    const saved=bones.map(b=>({position:b.position.clone(),quaternion:b.quaternion.clone()}));
    const restore=()=>{
        bones.forEach((b,i)=>{b.position.copy(saved[i].position);b.quaternion.copy(saved[i].quaternion);});
        player.root.userData.seated=false;player.root.updateMatrixWorld(true);
    };
    const f=seat.forward,yaw=Math.atan2(f.x,f.z);
    player.storyCamera=null;player.storyTarget=null;
    player.root.rotation.y=yaw;
    player.root.position.copy(seat.center).addScaledVector(f,seat.forwardOffset);player.root.position.y=0;
    player.root.updateMatrixWorld(true);
    const axis=new Vector3(f.z,0,-f.x);
    for(const bone of bones){
        const parent=bone.parent.getWorldQuaternion(new Quaternion());
        const rotation=new Quaternion().setFromAxisAngle(axis,-Math.PI*.42);
        bone.quaternion.premultiply(parent.clone().invert().multiply(rotation).multiply(parent));
        const joint=bone.getWorldPosition(new Vector3()).addScaledVector(f,10);joint.y+=6;
        bone.position.copy(bone.parent.worldToLocal(joint));
    }
    player.root.updateMatrixWorld(true);
    const vertex=new Vector3(),b=seat.bounds;let underside=Infinity;
    model.traverse(mesh=>{
        if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();
        for(let i=0;i<mesh.geometry.attributes.position.count;i++){
            mesh.getVertexPosition(i,vertex).applyMatrix4(mesh.matrixWorld);
            if(vertex.x>=b.min.x&&vertex.x<=b.max.x&&vertex.z>=b.min.z&&vertex.z<=b.max.z)underside=Math.min(underside,vertex.y);
        }
    });
    if(!Number.isFinite(underside)){restore();return null;}
    player.root.position.y+=b.max.y-underside+.3;
    player.root.userData.seated=true;player.root.updateMatrixWorld(true);
    return restore;
}
