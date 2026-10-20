import { CipherLobbyScene } from '../components/cipher3d/CipherLobbyScene.js';
import { buildCipherSimulationShell } from '../components/cipher3d/CipherSimulationShell.js';
import { SIMULATION_ROOM,simulationCanStand,nearbySimulationReturnDoor } from '../data/cipherSimulationRoom.js';
import { createCipherChairInteraction } from '../components/cipher3d/CipherChairInteraction.js';

export function enterCipherSimulationShell(lobby,competition){
    const position={x:lobby.controller.charPosX,y:lobby.controller.charPosY};
    if(!lobby.simulationRoomScene){
        const simulation=new CipherLobbyScene(lobby.layer.parentElement,()=>{
            simulation.hide();lobby.show();
            const saved=lobby.simulationReturnPosition;
            lobby.controller.charPosX=saved.x;lobby.controller.charPosY=saved.y;lobby.controller.facing='left';
        },{
            layout:SIMULATION_ROOM,buildRoom:buildCipherSimulationShell,canStand:simulationCanStand,
            createInteraction:createCipherChairInteraction,
            nearbyDoor:nearbySimulationReturnDoor,onDoorEnter:()=>void simulation.exit(),automaticExit:false,
            onConfirm:()=>{
                document.body.classList.add('cipher-facility-active');
                simulation.controller.keysHeld.clear();simulation.controller.isMoving=false;
                competition.open();
            },
            stageId:'cipherSimulationStage',label:'모의투자룸',
            hint:'WASD 이동 · Enter 모의투자 참여 · 왼쪽 문 F / Esc 로비'
        });
        const legacyClose=competition.onClose;
        competition.onClose=()=>{
            if(!simulation.active){legacyClose?.();return;}
            document.body.classList.remove('cipher-facility-active');
            simulation.controller.keysHeld.clear();simulation.layer.focus({preventScroll:true});
        };
        lobby.simulationRoomScene=simulation;
    }
    lobby.simulationReturnPosition=position;lobby.hide();lobby.simulationRoomScene.show();
}
