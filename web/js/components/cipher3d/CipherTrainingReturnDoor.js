import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { TRAINING_ROOM } from '../../data/cipherTrainingRoom.js';

export async function addCipherTrainingReturnDoor(room) {
    const url=new URL('../../../assets/office/3d/Cipher-return-door.glb',import.meta.url).href;
    const {scene:door}=await new GLTFLoader().loadAsync(url);
    door.name='training-lobby-return-door';
    door.scale.setScalar(100);door.rotation.y=-Math.PI/2;
    door.position.set(TRAINING_ROOM.width/2,0,TRAINING_ROOM.returnDoor.z);
    door.traverse(object=>{if(object.isMesh)object.castShadow=object.receiveShadow=true;});
    room.add(door);
    return door;
}
