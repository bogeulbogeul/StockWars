import { CipherLobbyScene } from '../../components/cipher3d/CipherLobbyScene.js';
import { buildCipherTrainingShell } from '../../components/cipher3d/CipherTrainingShell.js';
import { addCipherAgentK } from '../../components/cipher3d/CipherAgentK.js';
import { TRAINING_ROOM, trainingCanStand } from '../../data/cipherTrainingRoom.js';
import { createCharacterBodies } from '../../components/town3d/CharacterBodies.js';
import { createMoaWakeDialogue } from '../../components/dialogue/MoaWakeDialogue.js';
import { passageDoor, walkBetweenCipherRooms } from '../CipherRoomTravel.js';
import { walkTori, followTori } from './ToriLessonMovement.js';
import { prepareLessonBoard } from './ToriLessonBoard.js';
import { waitForStockExit } from './StockManualExit.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';

async function inviteToLesson() {
    const dialogue = createMoaWakeDialogue(); let finish;
    const key = event => {
        if (event.code !== 'KeyF' || event.repeat) return;
        event.preventDefault(); event.stopImmediatePropagation(); finish?.();
    };
    window.addEventListener('keydown', key, true);
    try { await new Promise(resolve => {
        finish = resolve;
        dialogue.showLine('큰 화면이 있는 트레이닝룸에서 설명해 드리겠습니다. 저를 따라오세요.',
            { speaker: 'tori', name: '토리', onNext: resolve });
    }); } finally { window.removeEventListener('keydown', key, true); dialogue.dispose(); }
}

export async function startToriLesson(scenes) {
    if (scenes.stockLesson) return;
    const lobby = scenes.rooms.get('stock'), teacher = lobby.room.getObjectByName('tori-character');
    scenes.tourActive = true; lobby.exitPending = true;
    try {
        await inviteToLesson();
        await walkTori(lobby, teacher, { x: -380, z: -100 });
        await followTori(lobby, teacher, '토리를 따라 트레이닝룸 문 앞으로 가서 F를 눌러 보자');
        // The story returns everyone through this door when the lesson ends.
        const training = new CipherLobbyScene(scenes.container, () => {}, {
            layout: TRAINING_ROOM, buildRoom: buildCipherTrainingShell, canStand: trainingCanStand,
            automaticExit: false, nearbyDoor: () => null,
            stageId: 'toriLessonTraining', label: '토리 주식 교실'
        });
        lobby.trainingRoomScene = training; await training.ready;
        const inside = await addCipherAgentK(training.room);
        inside.position.set(428, 0, -100);
        training.characterBodies = createCharacterBodies(training.room);
        await passageDoor(lobby, -1).open();
        await walkTori(lobby, teacher, { x: -428, z: -100 }, -1); teacher.visible = false;
        await passageDoor(training, 1).open();
        await walkTori(training, inside, { x: 250, z: -190 }, 1);
        prepareLessonBoard(training);
        await walkBetweenCipherRooms(lobby, training, -1);
        scenes.rooms.set('stock', training);
        scenes.stockLesson = { lobby, training, teacher: inside, lobbyTeacher: teacher };
        await followTori(training, inside, '토리에게 다가가 F를 눌러 큰 화면으로 배워 보자');
    } finally { scenes.tourActive = false; lobby.exitPending = false; }
}

export async function finishToriLesson(scenes) {
    const lesson = scenes.stockLesson;
    if (!lesson) return;
    const { lobby, training, teacher, lobbyTeacher } = lesson;
    const wasExitPending = lobby.exitPending;
    scenes.tourActive = true;
    try {
        if (lesson.armRest) (teacher.getObjectByName('Arm.R') || teacher.getObjectByName('ArmR')).quaternion.copy(lesson.armRest);
        await waitForStockExit(scenes, training, true);
        await passageDoor(training, 1).open();
        await walkBetweenCipherRooms(training, lobby, 1);
        scenes.toriReturn = returnToriToLobby(lesson).catch(error => console.error('Tori return:', error));
        // Clear the narrow doorway before the teacher follows, instead of
        // letting the teacher overlap or push the waiting player.
        await waitForStockExit(scenes, lobby);
        lobby.exitPending = true; lobby.controller.keysHeld.clear();
        training.room.userData.cameraRig = null;
        scenes.rooms.set('stock', lobby); scenes.stockLesson = null;
    } finally { lobby.exitPending = wasExitPending; lobby.controller.keysHeld.clear(); scenes.tourActive = false; }
}

async function returnToriToLobby({ lobby, training, teacher, lobbyTeacher }) {
    await new Promise(resolve => {
        const check = () => {
            const c = lobby.controller;
            if (!lobby.active || Math.hypot(c.charPosX + 380, c.charPosY / P + 100) > 115) resolve();
            else requestAnimationFrame(check);
        }; check();
    });
    await Promise.all([passageDoor(training, 1).open(), passageDoor(lobby, -1).open()]);
    await walkTori(training, teacher, { x: 428, z: -100 }, 1); teacher.visible = false;
    lobbyTeacher.position.set(-428, 0, -100); lobbyTeacher.visible = true;
    await walkTori(lobby, lobbyTeacher, { x: 0, z: -205 }, -1);
    await Promise.all([passageDoor(training, 1).close(), passageDoor(lobby, -1).close()]);
}
