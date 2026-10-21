import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

export async function addCozyLobbyPlants(room) {
    const url = new URL('../../../assets/office/3d/Cipher-cozy-plant.glb',import.meta.url).href;
    const gltf = await new GLTFLoader().loadAsync(url);
    for (const area of LOBBY.waitingAreas) {
        const plant=gltf.scene.clone(true);
        plant.name=`waiting-planter-${area.side}`;
        plant.scale.setScalar(100);
        plant.position.set(area.plantX,0,area.plantZ);
        plant.traverse(object=>{
            if(!object.isMesh)return;
            object.castShadow=object.receiveShadow=true;
        });
        room.add(plant);
    }
}
