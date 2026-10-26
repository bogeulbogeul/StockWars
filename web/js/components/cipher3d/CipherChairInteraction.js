// Character seating is disabled while its Somangi model is retired.
export class CipherChairInteraction {
    constructor(scene) { this.scene = scene; this.phase = 'idle'; this.idleHint = null; }
    async load() { return this; }
    onKeyRelease() {}
    tryEnter() { return false; }
    update() { return false; }
    reset() { this.scene.controller.isResting = false; }
}
export async function createCipherChairInteraction(scene) {
    return new CipherChairInteraction(scene).load();
}
