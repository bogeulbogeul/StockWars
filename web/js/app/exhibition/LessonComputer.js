import { createTourPlayerControls } from './TourPlayerControls.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';

export function isLessonComputerSeat(room) {
    const selected = room.seatInteraction?.selected;
    const chairs = room.room.userData.trainingSeats || [];
    return !!room.controller.busSeated && !!selected && selected.meshes.some(mesh => {
        for (let node = mesh; node; node = node.parent) if (chairs.some(chair => chair.model === node)) return true;
        return false;
    });
}

export async function waitForLessonComputer(app) {
    const room = app.scenes.rooms.get('stock'), c = room.controller;
    const guide = createMoaMovementGuide(room.layer, { computer: true });
    guide.update({ visible: true });
    app.scenes.computerAwaitingUse = true; app.view.panel.hidden = true;
    app.view.computerRequired = true; app.view.syncPhoneAvailability();
    room.player.holdFacing();
    let requested = false, previous;
    const controls = createTourPlayerControls(c, { onInteract: () => {
        if (room.active && isLessonComputerSeat(room)) requested = true;
    } });
    try {
        await new Promise(resolve => {
            const tick = now => {
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; controls.update(dt);
                if (requested) resolve(); else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    } finally { controls.dispose(); guide.dispose(); app.scenes.computerAwaitingUse = false; }
    const phone = app.view.phoneHome;
    app.view.computerPowerRequested = true;
    let opened;
    try { opened = app.view.openPhone(); }
    finally { app.view.computerPowerRequested = false; }
    if (!opened) return false;
    phone.dialog.setAttribute('aria-label', '트레이닝룸 컴퓨터');
    phone.dialog.classList.add('cozy-phone--terminal');
    phone.openApp('stock'); phone.stockApp.tab = 'market'; phone.stockApp.renderTab();
    phone.dialog.addEventListener('close', () => {
        phone.dialog.classList.remove('cozy-phone--terminal'); phone.dialog.setAttribute('aria-label', '스마트폰');
    }, { once: true });
    return true;
}
