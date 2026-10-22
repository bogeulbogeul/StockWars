import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';

// Character assets retired by user request; keep the movement/camera contract.
export class SomangiPlayer {
    constructor(scene, town) {
        this.town = town;
        this.root = new THREE.Group();
        this.root.name = 'player-camera-anchor';
        scene.add(this.root);
        this.variants = new Map();
        this.state = 'idle';
        this.hint = document.createElement('p');
        this.hint.hidden = true;
        this.ready = Promise.resolve();
        this.update();
    }
    setControlsHint() {}
    updateHint() {}
    setState() { this.state = 'idle'; }
    play() { return false; }
    update() {
        const c = this.town.playerController;
        c.somangiCrab = c.somangiCrabManual = c.somangiCrabAuto = false;
        c.somangiCrabSuspended = true;
        const p = c.renderPosition;
        this.root.position.set(p.x, 0, p.y / GROUND_PROJECTION);
        this.root.rotation.y = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 }[c.facing] ?? 0;
    }
}
