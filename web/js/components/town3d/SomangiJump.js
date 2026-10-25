// Move the whole character rigidly: no scaling, new joints, or skin deformation.
export const SOMANGI_JUMP = Object.freeze({ height: 20, duration: .55 });
export class SomangiJump {
    constructor() { this.cancel(); }
    start() {
        if (this.active) return false;
        this.active = true; this.elapsed = 0; this.offset = 0; return true;
    }
    update(dt) {
        if (!this.active) return 0;
        this.elapsed = Math.min(SOMANGI_JUMP.duration, this.elapsed + (Number.isFinite(dt) ? Math.max(0, dt) : 0));
        const progress = this.elapsed / SOMANGI_JUMP.duration;
        this.offset = 4 * SOMANGI_JUMP.height * progress * (1 - progress);
        if (progress === 1) { this.active = false; this.offset = 0; }
        return this.offset;
    }
    cancel() { this.active = false; this.elapsed = 0; this.offset = 0; }
}
