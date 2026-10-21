import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { TRAINING_ROOM } from '../../data/cipherTrainingRoom.js';

export async function addCipherTrainingCabinet(room) {
    const loader=new GLTFLoader();
    const load=name=>loader.loadAsync(new URL(`../../../assets/office/3d/${name}.glb`,import.meta.url).href);
    const [{scene:cabinet},{scene:decor}]=await Promise.all([
        load('Cipher-training-cabinet'),load('Cipher-cabinet-decor')
    ]);
    cabinet.name='training-storage-cabinet';
    cabinet.scale.setScalar(100);
    cabinet.position.set(TRAINING_ROOM.cabinet.x,0,TRAINING_ROOM.cabinet.z);
    decor.name='training-cabinet-decor';
    decor.position.y=.83;
    cabinet.add(decor);
    cabinet.traverse(object=>{if(object.isMesh)object.castShadow=object.receiveShadow=true;});
    room.add(cabinet);
    return cabinet;
}
