import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { SIMULATION_ROOM } from '../../data/cipherSimulationRoom.js';

// Share the approved lobby/training models without changing their source assets.
export async function addCipherSimulationDecor(room){
    const loader=new GLTFLoader();
    const load=name=>loader.loadAsync(new URL(`../../../assets/office/3d/${name}.glb`,import.meta.url).href);
    const names=['Cipher-training-cabinet','Cipher-cabinet-decor','Cipher-cozy-plant'];
    const models=await Promise.all(names.map(load));
    const add=(index,name,x,z,rotation=0)=>{
        const model=models[index].scene.clone(true);
        model.name=name;model.scale.setScalar(100);model.position.set(x,0,z);model.rotation.y=rotation;
        model.traverse(object=>{if(object.isMesh)object.castShadow=object.receiveShadow=true;});
        room.add(model);return model;
    };
    const {cabinet,plants}=SIMULATION_ROOM;
    const storage=add(0,'simulation-storage-cabinet',cabinet.x,cabinet.z);
    const decor=models[1].scene;decor.name='simulation-cabinet-decor';decor.position.y=.83;
    storage.add(decor);
    decor.traverse(object=>{if(object.isMesh)object.castShadow=object.receiveShadow=true;});
    plants.forEach((plant,index)=>add(2,`simulation-planter-${index}`,plant.x,plant.z));
    return storage;
}
