import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { TRAINING_ROOM } from '../../data/cipherTrainingRoom.js';

export async function addCipherTrainingDesks(room, layout = TRAINING_ROOM, prefix = 'training') {
    const loader=new GLTFLoader();
    const load=name=>loader.loadAsync(new URL(`../../../assets/office/3d/${name}.glb`,import.meta.url).href);
    const [{scene:source},{scene:computers}]=await Promise.all([
        load('Cipher-training-desk'),load('Cipher-training-computers')
    ]);
    return layout.desks.map(desk=>{
        const model=source.clone(true);
        model.name=`${prefix}-desk-${desk.id}`;
        model.scale.setScalar(100);
        model.position.set(desk.x,0,desk.z);
        model.traverse(object=>{
            if(object.isMesh)object.castShadow=object.receiveShadow=true;
        });
        room.add(model);
        const computer=computers.clone(true);
        computer.name=`${prefix}-computers-${desk.id}`;
        computer.scale.setScalar(100);
        computer.position.set(desk.x,72,desk.z);
        computer.traverse(object=>{
            if(object.isMesh)object.castShadow=object.receiveShadow=true;
        });
        room.add(computer);
        return model;
    });
}
