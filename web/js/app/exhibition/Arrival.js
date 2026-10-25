import { stepAsideForMoa } from '../../components/town3d/SomangiStepAside.js';
import { faceConversation } from '../../components/town3d/ConversationFacing.js';
import { createMoaWakeDialogue } from '../../components/dialogue/MoaWakeDialogue.js';
import { SOMANGI_MOVEMENT } from '../../data/somangiMovement.js';
import { gameKey } from '../GameKeys.js';
import { MOA_TOWN_POSITION } from '../../data/moaModels.js';
import { TOWN_ARRIVAL } from '../../data/townLandscapeLayout.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { MOA_APPROACH_AREA, outsideMoaApproach, nextMoaCall } from '../../data/moaWake.js';
import { moveTownBody, recoverTownBody } from '../../components/town3d/TownBodyMovement.js';
export { nextMoaCall } from '../../data/moaWake.js';

export const MOA_ARRIVAL = Object.freeze({ ...MOA_TOWN_POSITION, radius: 80 });
export function nearSleepingMoa(position) {
    return Math.hypot(position.x - MOA_ARRIVAL.x, position.y - MOA_ARRIVAL.y) <= MOA_ARRIVAL.radius;
}
const arrivalKey = event => /^Key[WASDF]$/.test(event.code) ? event.code.slice(3).toLowerCase() : event.key.toLowerCase();
const DIRECTIONS = { w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
export const ARRIVAL_LIMITS = MOA_APPROACH_AREA;

export class ExhibitionArrival {
    constructor(app) {
        this.app = app; this.keys = new Set(); this.active = false;
        this.dialogue = createMoaWakeDialogue();
        this.reminder = createMoaWakeDialogue();
        window.addEventListener('keydown', event => {
            if (!this.active || event.ctrlKey || event.metaKey || event.altKey
                || event.target.closest?.('input, textarea, select') || document.querySelector('dialog[open]')) return;
            if (this.reminder.isOpen) {
                event.preventDefault(); event.stopImmediatePropagation();
                if (arrivalKey(event) === 'f' && !event.repeat) this.reminder.hide();
                return;
            }
            if (gameKey(event) === 'space' && !event.target.closest?.('button, a[href]')) {
                event.preventDefault(); event.stopImmediatePropagation();
                if (!event.repeat) this.app.scenes.townModelScene.player?.play('jump', { scripted: true });
                return;
            }
            const key = arrivalKey(event);
            if (!DIRECTIONS[key] && key !== 'f') return;
            event.preventDefault(); event.stopImmediatePropagation();
            if (DIRECTIONS[key]) this.keys.add(key);
            if (key === 'f' && !event.repeat) this.talk();
        }, true);
        window.addEventListener('keyup', event => {
            if (!this.active) return;
            this.keys.delete(arrivalKey(event)); this.rememberPosition();
        }, true);
        window.addEventListener('blur', () => this.keys.clear());
        document.addEventListener('visibilitychange', () => { if (document.hidden) this.keys.clear(); });
    }
    start({ showGuide = false } = {}) {
        this.stop(); this.active = true; this.leaveWarningLatched = false;
        void this.app.scenes.ready.then(() => { if (this.active) return this.app.scenes.townModelScene.sleepingAnna?.setAwake(false); });
        const c = this.app.scenes.townStage.playerController;
        const p = this.app.state.arrivalPosition;
        if (!showGuide && p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
            c.charPosX = Math.max(900, Math.min(1180, p.x));
            c.charPosY = Math.max(2270, Math.min(2410, p.y));
        } else if (!showGuide) Object.assign(c, { charPosX: TOWN_ARRIVAL.x, charPosY: TOWN_ARRIVAL.y });
        this.moved = !showGuide && Math.hypot(c.charPosX - TOWN_ARRIVAL.x, c.charPosY - TOWN_ARRIVAL.y) > .5;
        this.drawPanel();
        this.last = performance.now();
        const tick = now => {
            if (!this.active) return;
            const dt = Math.min((now - this.last) / 1000, .05); this.last = now;
            let dx = 0, dy = 0;
            for (const key of this.keys) { const d = DIRECTIONS[key]; if (d) { dx += d[0]; dy += d[1]; } }
            const length = Math.hypot(dx, dy);
            const before = { x: c.charPosX, y: c.charPosY };
            if (length && !document.hidden && c.modelCollisionReady) {
                const step = SOMANGI_MOVEMENT.arrivalWalk * dt / length;
                const leaving = outsideMoaApproach(c.charPosX + dx * step, c.charPosY + dy * step);
                if (!this.app.state.moaCalls && leaving && !this.leaveWarningLatched) {
                    this.leaveWarningLatched = true; this.keys.clear(); this.dialogue.hide(); this.guide.update({ visible: false });
                    this.reminder.showLine('우선 저 아이에게 말을 걸어보자.', { name: this.app.state.nickname || '???' });
                    this.frame = requestAnimationFrame(tick); return;
                }
                if (!leaving) this.leaveWarningLatched = false;
                recoverTownBody(c, ARRIVAL_LIMITS);
                moveTownBody(c, dx / length * SOMANGI_MOVEMENT.arrivalWalk * dt,
                    dy / length * SOMANGI_MOVEMENT.arrivalWalk * dt, ARRIVAL_LIMITS);
                c.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
            }
            if (Math.hypot(c.charPosX - before.x, c.charPosY - before.y) > .01) { this.moved = true; this.dialogue.hide(); }
            this.guide.update({ visible: !this.moved && !this.reminder.isOpen });
            this.frame = requestAnimationFrame(tick);
        };
        this.frame = requestAnimationFrame(tick);
    }
    near() {
        const c = this.app.scenes.townStage.playerController;
        return nearSleepingMoa({ x: c.charPosX, y: c.charPosY });
    }
    rememberPosition() {
        const c = this.app.scenes.townStage.playerController;
        this.app.state.arrivalPosition = { x: c.charPosX, y: c.charPosY }; this.app.save();
    }
    drawPanel() {
        const view = this.app.view;
        this.guide?.dispose();
        view.panel.hidden = true;
        this.guide = createMoaMovementGuide(view.root);
        this.guide.update({ visible: !this.moved && !this.reminder.isOpen });
    }

    async talk() {
        if (!this.active || !this.near()) return;
        if (this.dialogue.isOpen) { this.dialogue.hide(); return; }
        const previous = structuredClone(this.app.state);
        this.app.state.moaCalls = nextMoaCall(this.app.state.moaCalls, true);
        this.app.state.flags.moaAwake = this.app.state.moaCalls === 3;
        if (!this.app.save()) { this.app.state = previous; return; }
        faceConversation(this.app.scenes.townModelScene.player, this.app.scenes.townModelScene.sleepingAnna);
        if (this.app.state.flags.moaAwake) {
            const moa = this.app.scenes.townModelScene.sleepingAnna;
            this.stop(); this.app.busy = true; this.app.view.panel.hidden = true;
            await stepAsideForMoa(this.app.scenes.townModelScene.player, moa);
            await moa?.setAwake(true);
            await moa?.standReady;
            faceConversation(this.app.scenes.townModelScene.player, moa);
            void this.app.render();
        }
        else this.dialogue.show(this.app.state.moaCalls);
    }
    stop() {
        this.active = false; this.keys.clear(); cancelAnimationFrame(this.frame);
        this.guide?.dispose(); this.dialogue?.hide(); this.reminder?.hide(); this.app.view.panel.hidden = false;
    }
}
