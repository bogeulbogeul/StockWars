import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { TRAINING_ROOM } from '../../data/cipherTrainingRoom.js';

export async function addCipherTrainingChairs(room, layout = TRAINING_ROOM, prefix = 'training') {
    const url=new URL('../../../assets/office/3d/Cipher-office-chair.glb',import.meta.url).href;
    const {scene:source}=await new GLTFLoader().loadAsync(url);
    const chairs=layout.desks.map(desk=>{
        const model=source.clone(true);
        model.name=`${prefix}-chair-${desk.id}`;
        model.scale.setScalar(100);
        model.position.set(desk.x,0,desk.chairZ);
        model.rotation.y=Math.PI;
        model.traverse(object=>{if(object.isMesh)object.castShadow=object.receiveShadow=true;});
        room.add(model);
        return {id:desk.id,model,contact:model.getObjectByName('Seat_Contact_Point')};
    });
    room.userData.facilitySeats=chairs;
    if(prefix==='training')room.userData.trainingSeats=chairs;
    return chairs;
}
