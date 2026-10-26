const TARGET_MS = 1000 / 60;
export function renderRatio(width, height, deviceRatio, scale = 1) {
    const cap = Math.min(deviceRatio || 1, 1.25, Math.sqrt(1152000 / Math.max(1, width * height)));
    return Math.min(cap, Math.max(.35, cap * scale));
}

// All scene clocks still advance every frame. Only the 3D drawing buffer and
// shadow resolution adapt; CSS text, game coordinates and collision stay fixed.
export class FrameBudget {
    constructor(renderer, scene) {
        this.renderer = renderer; this.scene = scene; this.scale = Math.min(.65, renderer.getPixelRatio());
        this.width = 1280; this.height = 800;
        this.samples = []; this.last = null; this.elapsed = 0; this.cooldown = 0;
        this.targetFPS = 60;
    }
    resize(width, height) {
        this.width = width; this.height = height;
        this.apply(); this.reset();
    }
    apply() {
        const ratio = renderRatio(this.width, this.height, globalThis.devicePixelRatio || 1, this.scale);
        if (Math.abs(this.renderer.getPixelRatio() - ratio) > .015) this.renderer.setPixelRatio(ratio);
    }
    reset() { this.last = null; this.samples.length = 0; this.elapsed = 0; }
    tick(now) {
        if (this.last == null) { this.last = now; return; }
        const dt = now - this.last; this.last = now;
        // Loading and resuming a hidden scene must not be interpreted as GPU load.
        if (dt <= 0 || dt > 120) { this.samples.length = 0; this.elapsed = 0; return; }
        this.samples.push(dt); this.elapsed += dt;
        if (this.elapsed < 750) return;
        const average = this.elapsed / this.samples.length;
        const slow = this.samples.filter(value => value > TARGET_MS * 1.2).length / this.samples.length;
        this.samples.length = 0; this.elapsed = 0;
        if (average > TARGET_MS * 1.01 || slow > .02) {
            this.cooldown = 0;
            if (this.scale > .5) { this.scale = Math.max(.5, this.scale * .86); this.apply(); }
            else this.reduceShadows();
        } else if (average < TARGET_MS * 1.015 && slow < .03 && ++this.cooldown >= 8) {
            this.cooldown = 0;
            this.scale = Math.min(1, this.scale + .025); this.apply();
        }
    }
    reduceShadows() {
        this.scene?.traverse(light => {
            if (!light.isDirectionalLight || !light.castShadow || light.shadow.mapSize.x <= 512) return;
            light.shadow.mapSize.multiplyScalar(.5);
            light.shadow.map?.dispose(); light.shadow.map = null;
            light.shadow.needsUpdate = true;
        });
    }
}
