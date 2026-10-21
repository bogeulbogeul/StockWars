import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { addCipherLobbyShell } from './CipherLobbyShell.js';
import { SIMULATION_ROOM } from '../../data/cipherSimulationRoom.js';
import { CipherSeasonRankingBoard } from './CipherSeasonRankingBoard.js';
import { addCipherTrainingDesks } from './CipherTrainingDesks.js';
import { addCipherTrainingChairs } from './CipherTrainingChairs.js';
import { addCipherSimulationDecor } from './CipherSimulationDecor.js';

export function buildCipherSimulationShell(scene){
    const room=new THREE.Group();room.name='cipher-simulation-room';
    room.userData.shellReady=addCipherLobbyShell(room,'Cipher-simulation-shell');
    room.userData.seasonRankingBoard=new CipherSeasonRankingBoard(room);
    room.userData.deskReady=addCipherTrainingDesks(room,SIMULATION_ROOM,'simulation');
    room.userData.seatingReady=addCipherTrainingChairs(room,SIMULATION_ROOM,'simulation');
    room.userData.furnitureReady=addCipherSimulationDecor(room);
    room.userData.doorsReady=(async()=>{
        const url=new URL('../../../assets/office/3d/Cipher-return-door.glb',import.meta.url).href;
        const {scene:door}=await new GLTFLoader().loadAsync(url);
        door.name='simulation-lobby-return-door';door.scale.setScalar(100);door.rotation.y=Math.PI/2;
        door.position.set(-SIMULATION_ROOM.width/2,0,SIMULATION_ROOM.returnDoor.z);
        door.traverse(object=>{if(object.isMesh)object.castShadow=object.receiveShadow=true;});
        room.add(door);return door;
    })();
    scene.add(room);return room;
}
