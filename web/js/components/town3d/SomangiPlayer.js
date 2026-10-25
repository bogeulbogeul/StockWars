import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { SOMANGI_HEIGHT, SOMANGI_REFERENCE_HEIGHT, SOMANGI_FOOT_Y, SOMANGI_MODELS } from '../../data/somangiModels.js';
import { createSomangiControls } from './SomangiControls.js';
import { loadSomangi } from './SomangiAssets.js';
import { SomangiExpressions } from './SomangiExpressions.js';

export class SomangiPlayer {
    constructor(scene, town, layer) {
        this.town = town;
        this.root = new THREE.Group();
        this.root.name = 'somangi-player';
        scene.add(this.root);
        this.variants = new Map();
        this.state = 'loading';
        this.expressions = new SomangiExpressions();
        this.hint = createSomangiControls(layer, action => this.play(action), () => this.blocked());
        this.update();
        this.ready = this.load();
    }
    blocked() {
        return this.town.containerEl?.classList.contains('hidden') || this.town.buildingInfoOpen || this.town.callbacks?.isInputBlocked?.();
    }
    async load() {
        await Promise.all(Object.entries(SOMANGI_MODELS).map(async ([name, definition]) => {
            const { model, animations } = await loadSomangi(name);
            const scale = SOMANGI_HEIGHT / SOMANGI_REFERENCE_HEIGHT;
            model.scale.setScalar(scale); model.position.y = -SOMANGI_FOOT_Y * scale;
            model.visible = false; this.root.add(model); this.expressions.register(model);
            const mixer = new THREE.AnimationMixer(model);
            const clip = animations.find(item => item.name === definition.clip);
            if (!clip) throw new Error(`Missing Somangi animation: ${definition.clip}`);
            const action = mixer.clipAction(clip);
            this.variants.set(name, { model, mixer, action });
            mixer.addEventListener('finished', () => {
                if (this.state !== name) return;
                this.setState('idle'); void this.setExpression(this.expressionBeforeEat || 'smile');
            });
        }));
        this.setState('idle'); this.updateHint();
    }
    get expressionId() { return this.expressions.id; }
    setExpression(id) { return this.expressions.set(id); }
    faceCamera(camera) { this.storyCamera = camera; }
    setControlsHint(text) { this.customHint = text; this.updateHint(); }
    updateHint() { this.hint.textContent = this.customHint || 'WASD 이동 · 2 먹기'; }
    setState(state) {
        if (this.state === state) return;
        for (const variant of this.variants.values()) { variant.action.stop(); variant.model.visible = false; }
        this.state = state;
        const variant = this.variants.get(state === 'idle' ? 'walk' : state);
        if (!variant) return;
        variant.model.visible = true;
        if (state === 'idle') return;
        variant.action.setLoop(state === 'eat' ? THREE.LoopOnce : THREE.LoopRepeat, state === 'eat' ? 1 : Infinity);
        variant.action.clampWhenFinished = state === 'eat'; variant.action.reset().play();
    }
    play(action, { scripted = false } = {}) {
        if (action !== 'eat' || !this.variants.has('eat') || (!scripted && this.blocked()) || this.state === 'walk' || this.state === 'eat') return false;
        this.expressionBeforeEat = this.expressionId;
        void this.setExpression('delicious'); this.setState('eat'); return true;
    }
    update(dt = 0) {
        const c = this.town.playerController;
        c.somangiCrab = c.somangiCrabManual = c.somangiCrabAuto = false;
        c.somangiCrabSuspended = true;
        const p = c.renderPosition;
        const x = p.x, z = p.y / GROUND_PROJECTION;
        const distance = this.previous ? Math.hypot(x - this.previous.x, z - this.previous.z) : 0;
        this.previous = { x, z };
        const moving = distance > .02 && distance < 100 && !c.resting;
        if (moving) this.storyCamera = null;
        this.root.position.set(p.x, 0, p.y / GROUND_PROJECTION);
        this.root.rotation.y = this.storyCamera ? Math.atan2(this.storyCamera.position.x - x, this.storyCamera.position.z - z)
            : ({ down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 }[c.facing] ?? 0);
        if (this.state === 'loading') return;
        if (moving && this.state !== 'walk') {
            if (this.state === 'eat') void this.setExpression(this.expressionBeforeEat || 'smile');
            this.setState('walk');
        } else if (!moving && this.state === 'walk') this.setState('idle');
        const variant = this.variants.get(this.state);
        if (variant) { variant.mixer.timeScale = this.state === 'walk' && c.isRunning ? 1.5 : 1; variant.mixer.update(Math.min(dt, .1)); }
    }
}
