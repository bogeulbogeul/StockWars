import { CipherLobbyScene } from '../components/cipher3d/CipherLobbyScene.js';
import { buildCipherTrainingShell } from '../components/cipher3d/CipherTrainingShell.js';
import { TRAINING_ROOM, trainingCanStand, nearbyTrainingReturnDoor } from '../data/cipherTrainingRoom.js';
import { createCipherChairInteraction } from '../components/cipher3d/CipherChairInteraction.js';
import { walkBetweenCipherRooms } from './CipherRoomTravel.js';

export async function enterCipherTrainingShell(lobby) {
    lobby.trainingRoomScene ||= new CipherLobbyScene(lobby.layer.parentElement,
        () => walkBetweenCipherRooms(lobby.trainingRoomScene, lobby, 1), {
        layout: TRAINING_ROOM,
        buildRoom: buildCipherTrainingShell,
        canStand: trainingCanStand,
        createInteraction: createCipherChairInteraction,
        nearbyDoor: nearbyTrainingReturnDoor,
        onDoorEnter: () => void lobby.trainingRoomScene.exit(),
        automaticExit: false,
        stageId: 'cipherTrainingStage',
        label: '증권사 트레이닝룸 3D 공간',
        hint: 'WASD 이동 · Shift 달리기 · 오른쪽 문 F / Esc 로비'
    });
    await walkBetweenCipherRooms(lobby, lobby.trainingRoomScene, -1);
}
