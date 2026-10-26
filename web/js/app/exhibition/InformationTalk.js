export { waitForBankTalk } from './BankTalk.js';

// Begin only after the visitor sits on the stool opposite the counter.
export function waitForInformationTalk(scenes) {
    return waitForCounterSeat(scenes, 'information', 'informationAwaitingTalk');
}
function waitForCounterSeat(scenes, place, waitingFlag) {
    const room = scenes.rooms.get(place);
    const c = room.controller;
    const visitorSeat = room.seatInteraction.seats.find(seat => seat.meshes.some(mesh => mesh.name === 'Round_Sage_Cushion'));
    if (!visitorSeat) throw new Error('창구 맞은편 의자를 찾지 못했어요.');
    visitorSeat.forward.set(0, 0, -1);
    return new Promise(resolve => {
        const onKey = event => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.('input, textarea, select')) return;
            if (event.code === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); return; }
            if (event.code !== 'KeyF') return;
            event.preventDefault(); event.stopImmediatePropagation();
        };
        window.addEventListener('keydown', onKey, true);
        const checkSeat = () => {
            if (room.active && c.busSeated && room.seatInteraction.selected === visitorSeat) {
                c.keysHeld.clear(); c.isMoving = false;
                scenes[waitingFlag] = false;
                window.removeEventListener('keydown', onKey, true);
                resolve();
            } else requestAnimationFrame(checkSeat);
        };
        requestAnimationFrame(checkSeat);
    });
}
