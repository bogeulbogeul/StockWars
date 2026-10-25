import {Box3,Vector3,Quaternion} from '../../../vendor/three/three.module.js';
import {TOWN_MODEL_PROPS} from '../../data/townModelProps.js';

function descriptor(id,label,meshes,{stool=false,slots=1,forwardOffset}={}){
    if(!meshes.length)return [];
    const bounds=new Box3();meshes.forEach(m=>bounds.union(new Box3().setFromObject(m)));
    const center=bounds.getCenter(new Vector3());
    const forward=new Vector3(0,0,1).applyQuaternion(meshes[0].getWorldQuaternion(new Quaternion()));
    forward.y=0;forward.normalize();
    const right=new Vector3(forward.z,0,-forward.x);
    const depth=Math.abs(forward.x)*(bounds.max.x-bounds.min.x)+Math.abs(forward.z)*(bounds.max.z-bounds.min.z);
    return Array.from({length:slots},(_,i)=>({id:`${id}-${i}`,label,bounds:bounds.clone(),forward:forward.clone(),
        center:center.clone().addScaledVector(right,slots===1?0:(i-.5)*100),
        forwardOffset:forwardOffset ?? (stool?0:depth/2+6),meshes}));
}

export function townSeatSurfaces(scene){
    return TOWN_MODEL_PROPS.filter(d=>d.file==='Bench-clean.glb').flatMap(d=>{
        const root=scene.getObjectByName(d.id),meshes=[];
        root?.traverse(m=>{if(m.isMesh&&m.name.startsWith('Rounded_Seat_Slat'))meshes.push(m);});
        return descriptor(d.id,d.name,meshes);
    });
}

export function indoorSeatSurfaces(room){
    room.updateMatrixWorld(true);const result=[];
    const names={Round_Sage_Cushion:['안내소 스툴',{stool:true}],Seat_Sage_Cushion:['안내소 의자',{}],
        Single_Long_Seat:['은행 대기 소파',{slots:2}],Executive_Seat:['은행 창구 의자',{}],
        Sofa_Seat_Cushion:['대기 의자',{}],Office_Chair_Seat_Cushion:['업무 의자',{}],
        Information_Waiting_Seat_1:['안내소 대기 소파',{forwardOffset:22}],Information_Waiting_Seat_2:['안내소 대기 소파',{forwardOffset:22}]};
    room.traverse(mesh=>{
        const entry=names[mesh.name];if(!mesh.isMesh||!entry)return;
        const label = mesh.parent.name === 'bank-visitor-stool' ? '은행 방문객 의자' : entry[0];
        result.push(...descriptor(`${mesh.parent.name}-${mesh.name}`,label,[mesh],entry[1]));
    });
    return result;
}
