// Reuse the existing trading rooms and their account/competition contracts.
export function connectCipherLobbyRooms(scene, lobby) {
    let current = null;
    for (const [id, room] of Object.entries({ training: lobby.trainingRoom, competition: lobby.competitionRoom })) {
        const legacyClose = room.onClose;
        room.onClose = () => {
            if (current?.id !== id) { legacyClose?.(); return; }
            const saved = current;
            current = null;
            document.body.classList.remove('cipher-facility-active');
            scene.controller.keysHeld.clear();
            scene.controller.isMoving = false;
            scene.controller.charPosX = saved.x;
            scene.controller.charPosY = saved.y;
            scene.controller.facing = id === 'training' ? 'right' : 'left';
            scene.layer.focus({ preventScroll: true });
        };
        // Competition fields must accept typing without triggering game shortcuts.
        room.dialog.addEventListener('keydown', event => {
            if (current?.id === id && event.key === 'Escape'
                && event.target.closest('dialog') === room.dialog) {
                event.preventDefault();
                if (!event.repeat) room.close();
            }
            event.stopPropagation();
        });
    }
    scene.onDoorEnter = door => {
        if (current || !scene.active || scene.blocked()) return;
        const room = door.id === 'training' ? lobby.trainingRoom : lobby.competitionRoom;
        current = { id: door.id, x: scene.controller.charPosX, y: scene.controller.charPosY };
        scene.controller.keysHeld.clear();
        scene.controller.isMoving = false;
        document.body.classList.add('cipher-facility-active');
        try { room.open(); }
        catch (error) {
            current = null;
            document.body.classList.remove('cipher-facility-active');
            throw error;
        }
    };
}
