import { CipherLobbyScene } from '../components/cipher3d/CipherLobbyScene.js';
import { buildCipherTrainingShell } from '../components/cipher3d/CipherTrainingShell.js';
import { TRAINING_ROOM, trainingCanStand, nearbyTrainingReturnDoor } from '../data/cipherTrainingRoom.js';
import { createCipherChairInteraction } from '../components/cipher3d/CipherChairInteraction.js';

export function enterCipherTrainingShell(lobby) {
    const position = { x: lobby.controller.charPosX, y: lobby.controller.charPosY };
    lobby.trainingRoomScene ||= new CipherLobbyScene(lobby.layer.parentElement, () => {
        lobby.trainingRoomScene.hide();
        lobby.show();
        const saved = lobby.trainingReturnPosition;
        lobby.controller.charPosX = saved.x;
        lobby.controller.charPosY = saved.y;
        lobby.controller.facing = 'right';
    }, {
        layout: TRAINING_ROOM,
        buildRoom: buildCipherTrainingShell,
        canStand: trainingCanStand,
        createInteraction: createCipherChairInteraction,
        nearbyDoor: nearbyTrainingReturnDoor,
        onDoorEnter: () => void lobby.trainingRoomScene.exit(),
        automaticExit: false,
        stageId: 'cipherTrainingStage',
        label: '증권사 트레이닝룸 3D 공간',
        hint: 'WASD / 방향키 이동 · Shift 달리기 · 오른쪽 문 F / Esc 로비'
    });
    lobby.trainingReturnPosition = position;
    lobby.hide();
    lobby.trainingRoomScene.show();
}
