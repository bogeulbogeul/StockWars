import { GROUND_PROJECTION as P, TOWN_MODEL_BUILDINGS } from '../data/townModelBuildings.js';
import { createTourPlayerControls } from './exhibition/TourPlayerControls.js';

let queue = Promise.resolve();
export function quickFade(change) {
    const run = async () => {
        const cover = document.createElement('div');
        cover.style.cssText = 'position:fixed;inset:0;background:#101621;opacity:0;z-index:2147483647;pointer-events:auto';
        document.body.append(cover);
        try {
            await cover.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, fill: 'forwards' }).finished;
            await change();
            await new Promise(resolve => setTimeout(resolve, 80));
            await cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).finished;
        } finally { cover.remove(); }
    };
    const result = queue.then(run, run); queue = result.catch(() => {}); return result;
}
export async function waitForDoorF(scenes, id) {
    if (scenes.doorEntryRequested === id) { scenes.doorEntryRequested = null; return; }
    const b = TOWN_MODEL_BUILDINGS.find(b => b.id === id), c = scenes.townStage.playerController;
    const hint = document.createElement('aside'); hint.className = 'moa-movement-guide';
    hint.textContent = '문 앞에서 F · 들어가기'; scenes.townStage.viewportEl.append(hint);
    scenes.tourActive = true;
    let requested = false, previous;
    const controls = createTourPlayerControls(c, { onInteract: () => {
        if (Math.abs(c.charPosX - b.x - (b.entranceOffsetX || 0)) < 110 && c.charPosY > b.y - 10 && c.charPosY < b.y + 170) requested = true;
    } });
    try { await new Promise(resolve => {
        const tick = now => {
            controls.update(previous === undefined ? 0 : Math.min((now - previous) / 1000, .05)); previous = now;
            if (requested) resolve(); else requestAnimationFrame(tick);
        }; requestAnimationFrame(tick);
    }); } finally { controls.dispose(); hint.remove(); scenes.tourActive = false; }
}
export function positionOutside(town, id) {
    const b = TOWN_MODEL_BUILDINGS.find(b => b.id === id), c = town.town.playerController;
    c.charPosX = b.x + (b.entranceOffsetX || 0); c.charPosY = b.y + 110;
    c.keysHeld.clear(); c.isMoving = false; c.scriptedWalking = false; c.facing = 'down';
    delete c.scriptedSupportHeight;
    town.player.storyYaw = town.player.storyTarget = town.player.storyCamera = null;
    town.player.root.visible = true; town.player.update(0); town.player.setState('idle');
    town.conversationCamera?.reset(town.camera);
}
