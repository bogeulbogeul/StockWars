import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';

// The desk separates the visitor from seated Moa, so allow talking across its
// front edge while still requiring the player to walk up from the entrance.
export function waitForInformationTalk(scenes) {
    const room = scenes.rooms.get('information'), moa = room.room.userData.moa;
    const c = room.controller;
    return new Promise(resolve => {
        const onKey = event => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.('input, textarea, select')) return;
            if (event.code === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); return; }
            if (event.code !== 'KeyF') return;
            event.preventDefault(); event.stopImmediatePropagation();
            if (event.repeat || !room.active) return;
            const distance = Math.hypot(c.charPosX - moa.root.position.x, c.charPosY / P - moa.root.position.z);
            if (distance > 310 || c.charPosY / P > 85) return;
            c.keysHeld.clear(); c.isMoving = false;
            scenes.informationAwaitingTalk = false;
            window.removeEventListener('keydown', onKey, true);
            resolve();
        };
        window.addEventListener('keydown', onKey, true);
    });
}
