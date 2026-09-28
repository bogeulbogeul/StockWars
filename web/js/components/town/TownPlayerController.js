import { TOWN_WORLD_WIDTH, TOWN_WORLD_HEIGHT, townEntrance } from '../../data/townLayout.js';
import { TOWN_LANDSCAPE } from '../../data/townLandscape.js';
import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS, TOWN_STREET_LAMPS, TOWN_URBAN_TREES } from '../../data/townWorldData.js';

const MOVE_KEYS = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's'];

// Screen-aligned RPG movement. Positions refer to the player's feet.
export class TownPlayerController {
    constructor(callbacks = {}) {
        this.callbacks = callbacks;
        this.worldWidth = TOWN_WORLD_WIDTH;
        this.worldHeight = TOWN_WORLD_HEIGHT;
        this.charPosX = 535;
        this.charPosY = 1042;
        this.charFacing = 1;
        this.facing = 'down';
        this.isMoving = false;
        this.walkPhase = 0;
        this.isResting = false;
        this.cameraX = this.cameraY = 0;
        this.keysHeld = new Set();
    }

    handleKeyDown(e) {
        if (e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        const key = e.key.toLowerCase();
        if (key === 'shift') this.keysHeld.add(key);
        if (MOVE_KEYS.includes(key)) {
            e.preventDefault?.();
            if (e.shiftKey) this.keysHeld.add('shift');
            else this.keysHeld.delete('shift');
            this.keysHeld.add(key);
            this.stopResting();
        }
    }

    handleKeyUp(e) { this.keysHeld.delete(e.key.toLowerCase()); }

    stopResting() {
        this.isResting = false;
        this.callbacks.onRestStateChange?.(false);
    }

    canStand(x, y) {
        const radius = 16;
        if (x < 60 || x > this.worldWidth - 60 || y < 100 || y > this.worldHeight - 100) return false;
        for (const b of TOWN_BUILDINGS) {
            const left = b.x + (b.width - b.asset.displayWidth) / 2;
            if (x > left - radius && x < left + b.asset.displayWidth + radius &&
                y > b.y - b.depth - radius && y < b.y + radius) return false;
        }
        if (TOWN_URBAN_TREES.some(treeX => Math.hypot((x - treeX - 120) / 1.5, y - 1230) < 32)) return false;
        if (TOWN_LANDSCAPE.some(p => x > p.x - radius && x < p.x + p.width + radius &&
            y > p.y - p.depth - radius && y < p.y + radius)) return false;
        if (TOWN_STREET_LAMPS.some(lampX => Math.hypot(x - lampX - 25, y - 1244) < 25)) return false;
        return !TOWN_INTERACTIVE_PROPS.some(p => x > p.x - radius && x < p.x + p.width + radius &&
            y > p.y - 24 - radius && y < p.y + radius);
    }

    placeAt(object) {
        const point = townEntrance(object);
        this.charPosX = point.x;
        this.charPosY = point.y;
        this.stopResting();
        this.keysHeld.clear();
        this.facing = 'down';
        this.isMoving = false;
    }

    update(dt, width = window.innerWidth, height = window.innerHeight) {
        let dx = 0, dy = 0;
        if (!this.isResting) {
            if (this.keysHeld.has('a') || this.keysHeld.has('arrowleft')) dx--;
            if (this.keysHeld.has('d') || this.keysHeld.has('arrowright')) dx++;
            if (this.keysHeld.has('w') || this.keysHeld.has('arrowup')) dy--;
            if (this.keysHeld.has('s') || this.keysHeld.has('arrowdown')) dy++;
        }
        const oldX = this.charPosX, oldY = this.charPosY;
        const running = this.keysHeld.has('shift');
        if (dx || dy) {
            const distance = (running ? 504 : 280) * Math.min(dt, 0.1) / Math.hypot(dx, dy);
            // Substeps prevent tunnelling through narrow footprints; axes slide along walls.
            const steps = Math.max(1, Math.ceil(distance / 8));
            for (let i = 0; i < steps; i++) {
                if (this.canStand(this.charPosX + dx * distance / steps, this.charPosY)) this.charPosX += dx * distance / steps;
                if (this.canStand(this.charPosX, this.charPosY + dy * distance / steps)) this.charPosY += dy * distance / steps;
            }
            if (dx) this.charFacing = Math.sign(dx);
            this.facing = dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right';
        }
        this.isMoving = oldX !== this.charPosX || oldY !== this.charPosY;
        this.walkPhase = this.isMoving ? this.walkPhase + dt * (running ? 15 : 9.5) : 0;
        this.updateCamera(width, height, dt);
    }

    updateCamera(width, height, dt = 0, snap = false) {
        const targetX = Math.max(0, Math.min(this.worldWidth - width, this.charPosX - width / 2));
        const targetY = Math.max(0, Math.min(this.worldHeight - height, this.charPosY - height * 0.62));
        const blend = snap ? 1 : 1 - Math.exp(-10 * dt);
        this.cameraX += (targetX - this.cameraX) * blend;
        this.cameraY += (targetY - this.cameraY) * blend;
    }

    restOnBench(bench, characterElement, containerElement) {
        this.placeAt(bench);
        this.isResting = true;
        this.callbacks.onRestStateChange?.(true);
        this.spawnHealEffect(bench, containerElement);
        this.callbacks.onHeal?.();
    }

    spawnHealEffect(bench, containerElement) {
        if (!containerElement) return;
        const effect = document.createElement('div');
        effect.className = 'bench-heal-effect';
        effect.style.left = `${bench.x + bench.width / 2 - 40}px`;
        effect.style.top = `${bench.y - 80}px`;
        effect.style.bottom = 'auto';
        effect.style.zIndex = '3000';
        effect.textContent = '✨ HP & 기력 100% 회복! 💖';
        containerElement.appendChild(effect);
        setTimeout(() => effect.remove(), 1600);
    }
}
