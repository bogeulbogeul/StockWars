import { Vector3 } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { MOA_TOWN_POSITION } from '../../data/moaModels.js';
import { TOWN_ARRIVAL } from '../../data/townLandscapeLayout.js';
import { el } from './View.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { nextMoaCall } from '../../data/moaWake.js';
export { nextMoaCall } from '../../data/moaWake.js';

export const MOA_ARRIVAL = Object.freeze({ ...MOA_TOWN_POSITION, radius: 80 });
export function nearSleepingMoa(position) {
    return Math.hypot(position.x - MOA_ARRIVAL.x, position.y - MOA_ARRIVAL.y) <= MOA_ARRIVAL.radius;
}
const DIRECTIONS = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1],
    a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };

export class ExhibitionArrival {
    constructor(app) {
        this.app = app; this.keys = new Set(); this.active = false;
        window.addEventListener('keydown', event => {
            if (!this.active || event.ctrlKey || event.metaKey || event.altKey
                || event.target.closest?.('input, textarea, select') || document.querySelector('dialog[open]')) return;
            const key = event.key.toLowerCase();
            if (!DIRECTIONS[key] && key !== 'f' && key !== 'enter') return;
            event.preventDefault(); event.stopImmediatePropagation();
            if (DIRECTIONS[key]) this.keys.add(key);
            if ((key === 'f' || key === 'enter') && !event.repeat) this.talk();
        }, true);
        window.addEventListener('keyup', event => {
            if (!this.active) return;
            this.keys.delete(event.key.toLowerCase()); this.rememberPosition();
        }, true);
        window.addEventListener('blur', () => this.keys.clear());
        document.addEventListener('visibilitychange', () => { if (document.hidden) this.keys.clear(); });
    }
    start() {
        this.stop(); this.active = true;
        void this.app.scenes.ready.then(() => { if (this.active) return this.app.scenes.townModelScene.sleepingAnna?.setAwake(false); });
        const c = this.app.scenes.townStage.playerController;
        const p = this.app.state.arrivalPosition;
        if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
            c.charPosX = Math.max(900, Math.min(1180, p.x));
            c.charPosY = Math.max(2270, Math.min(2410, p.y));
        } else Object.assign(c, { charPosX: TOWN_ARRIVAL.x, charPosY: TOWN_ARRIVAL.y });
        this.marker = el('div', 'exhibition-moa-marker', '모아 · 잠들어 있어요');
        this.app.view.root.append(this.marker);
        this.drawPanel();
        this.last = performance.now();
        const tick = now => {
            if (!this.active) return;
            const dt = Math.min((now - this.last) / 1000, .05); this.last = now;
            let dx = 0, dy = 0;
            for (const key of this.keys) { const d = DIRECTIONS[key]; if (d) { dx += d[0]; dy += d[1]; } }
            const length = Math.hypot(dx, dy);
            if (length && !document.hidden) {
                c.charPosX = Math.max(900, Math.min(1180, c.charPosX + dx / length * 165 * dt));
                c.charPosY = Math.max(2270, Math.min(2410, c.charPosY + dy / length * 165 * dt));
                c.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
            }
            const near = this.near();
            this.guide.update({ near, count: this.app.state.moaCalls || 0 });
            const scene = this.app.scenes.townModelScene;
            const point = new Vector3(MOA_ARRIVAL.x, 175, MOA_ARRIVAL.y / GROUND_PROJECTION).project(scene.camera);
            this.marker.style.left = `${(point.x + 1) * innerWidth / 2}px`;
            this.marker.style.top = `${(-point.y + 1) * innerHeight / 2}px`;
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
        this.guide = createMoaMovementGuide(view.root, {
            onInteract: () => this.talk(),
            onDirection: (key, held) => { if (held) this.keys.add(key); else { this.keys.delete(key); this.rememberPosition(); } }
        });
        this.talkButton = this.guide.interactButton;
        this.guide.update({ near: this.near(), count: this.app.state.moaCalls || 0 });
    }

    async talk() {
        if (!this.active || !this.near()) return;
        const previous = structuredClone(this.app.state);
        this.app.state.moaCalls = nextMoaCall(this.app.state.moaCalls, true);
        if (this.app.state.moaCalls === 3) this.app.state.flags.moaAwake = true;
        if (!this.app.save()) { this.app.state = previous; return; }
        if (this.app.state.flags.moaAwake) {
            const moa = this.app.scenes.townModelScene.sleepingAnna;
            this.stop(); this.app.busy = true;
            await moa?.setAwake(true);
            await moa?.standReady;
            void this.app.render();
        }
        else this.drawPanel();
    }
    stop() {
        this.active = false; this.keys.clear(); cancelAnimationFrame(this.frame); this.marker?.remove();
        this.guide?.dispose(); this.app.view.panel.hidden = false;
    }
}
