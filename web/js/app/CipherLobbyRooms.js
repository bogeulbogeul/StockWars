import { enterCipherTrainingShell } from './CipherTrainingEntrance.js';
import { enterCipherSimulationShell } from './CipherSimulationEntrance.js';
import { installCipherModelDialogue } from './CipherModelDialogue.js';

// Both facility doors enter walkable rooms; preserve legacy dialogs for in-room use.
export function connectCipherLobbyRooms(scene, lobby) {
    installCipherModelDialogue(scene, lobby);
    for (const room of [lobby.trainingRoom,lobby.competitionRoom]) {
        room.dialog.addEventListener('keydown', event => {
            if (event.key === 'Escape' && room.dialog.open
                && document.body.classList.contains('cipher-facility-active')
                && event.target.closest('dialog') === room.dialog) {
                event.preventDefault();
                if (!event.repeat) room.close();
            }
            event.stopPropagation();
        });
    }
    scene.onDoorEnter = door => {
        if (!scene.active || scene.blocked()) return;
        if (door.id === 'training') { enterCipherTrainingShell(scene); return; }
        if (door.id === 'competition') { enterCipherSimulationShell(scene,lobby.competitionRoom); return; }
    };
}
