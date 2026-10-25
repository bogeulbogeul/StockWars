import {Box3} from '../../../vendor/three/three.module.js';
import {GROUND_PROJECTION as P} from '../../data/townModelBuildings.js';

export function busStopPlatform(stop){
    const mesh=stop.getObjectByName('Smooth_Stone_Platform');
    stop.updateMatrixWorld(true);
    return mesh?new Box3().setFromObject(mesh):null;
}
export function busStopSupportHeight(platform,x,y){
    if(!platform)return 0;
    const z=y/P,padding=10;
    return x>=platform.min.x-padding&&x<=platform.max.x+padding
        &&z>=platform.min.z-padding&&z<=platform.max.z+padding?platform.max.y:0;
}
export const busStopSolidMesh=mesh=>mesh.name!=='Smooth_Stone_Platform';
