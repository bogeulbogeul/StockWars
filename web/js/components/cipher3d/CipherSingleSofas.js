import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

export async function addCipherSingleSofas(room) {
    const url = new URL('../../../assets/office/3d/Cipher-single-sofa.glb',import.meta.url).href;
    const gltf = await new GLTFLoader().loadAsync(url);
    const seats=[];
    for (const area of LOBBY.waitingAreas) {
        const sofa=gltf.scene.clone(true);
        sofa.name=`waiting-bench-${area.side}`;
        sofa.scale.setScalar(100);
        sofa.position.set(area.benchX,0,area.benchZ);
        sofa.rotation.y=area.benchRotation;
        sofa.traverse(object=>{
            if(!object.isMesh)return;
            object.castShadow=object.receiveShadow=true;
        });
        room.add(sofa);
        seats.push({id:area.side,model:sofa,contact:sofa.getObjectByName('Seat_Contact_Point')});
    }
    room.userData.waitingSeats=seats;
    return seats;
}
