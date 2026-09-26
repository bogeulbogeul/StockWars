/**
 * TownPlayerController Component
 * Handles 2D Side-view player keyboard movement, physics bounding, walking animation, and camera tracking.
 */

export class TownPlayerController {
    constructor(callbacks = {}) {
        this.callbacks = callbacks;
        this.worldWidth = 5900;
        this.charPosX = 260;
        this.charFacing = 1;
        this.isMoving = false;
        this.walkPhase = 0;
        this.isResting = false;
        this.cameraX = 0;
        this.targetCameraX = 0;
        this.smoothTime = 0.12;
        this.keysHeld = new Set();
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) {
            this.keysHeld.add(key);
            if (this.isResting) {
                this.isResting = false;
                if (this.callbacks.onRestStateChange) this.callbacks.onRestStateChange(false);
            }
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keysHeld.delete(key);
    }

    update(dt) {
        if (this.isResting) return;

        let moveDir = 0;
        if (this.keysHeld.has('arrowleft') || this.keysHeld.has('a')) moveDir -= 1;
        if (this.keysHeld.has('arrowright') || this.keysHeld.has('d')) moveDir += 1;

        if (moveDir !== 0) {
            const speed = 280; // px/sec
            this.charPosX += moveDir * speed * dt;
            this.charPosX = Math.max(60, Math.min(this.worldWidth - 60, this.charPosX));
            this.charFacing = moveDir > 0 ? 1 : -1;
            this.isMoving = true;
            this.walkPhase += dt * 9.5;
        } else {
            this.isMoving = false;
            this.walkPhase = 0;
        }

        // Camera Tracking
        const vpWidth = window.innerWidth;
        this.targetCameraX = this.charPosX - vpWidth / 2;
        const maxCamX = Math.max(0, this.worldWidth - vpWidth);
        this.targetCameraX = Math.max(0, Math.min(maxCamX, this.targetCameraX));
        this.cameraX += (this.targetCameraX - this.cameraX) * 0.14;
    }

    restOnBench(bench, characterElement, containerElement) {
        this.charPosX = bench.x + bench.width / 2;
        this.charFacing = 1;
        this.isMoving = false;
        this.isResting = true;
        this.keysHeld.clear();

        this.spawnHealEffect(bench, containerElement);
        if (this.callbacks.onHeal) this.callbacks.onHeal();
    }

    spawnHealEffect(bench, containerElement) {
        if (!containerElement) return;
        const effect = document.createElement('div');
        effect.className = 'bench-heal-effect';
        effect.style.left = `${bench.x + bench.width / 2 - 40}px`;
        effect.style.bottom = `120px`;
        effect.innerHTML = `
            <span class="heal-sparkle">✨</span>
            <span class="heal-text">HP & 기력 100% 회복!</span>
            <span class="heal-sparkle">💖</span>
        `;
        containerElement.appendChild(effect);
        setTimeout(() => effect.remove(), 1600);
    }
}