import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { SOMANGI_MODELS, SOMANGI_HEIGHT, somangiAssetUrl } from '../../data/somangiModels.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { createSomangiControls } from './SomangiControls.js';

// Independent local player presentation; saves, inventory and presence are untouched.
export class SomangiPlayer {
    constructor(scene, town, layer) {
        this.town = town;
        this.root = new THREE.Group();
        this.root.name = 'somangi-player';
        scene.add(this.root);
        this.variants = new Map();
        this.state = 'loading';
        this.hint = createSomangiControls(layer, action => this.play(action), () => this.blocked());
        this.ready = this.load();
    }

    blocked() {
        return this.town.containerEl.classList.contains('hidden') || this.town.buildingInfoOpen
            || this.town.callbacks.isInputBlocked?.();
    }

    async load() {
        const loader = new GLTFLoader();
        await Promise.all(Object.entries(SOMANGI_MODELS).map(async ([name, definition]) => {
            const gltf = await loader.loadAsync(somangiAssetUrl(definition.file));
            const model = gltf.scene;
            model.traverse(object => { if (object.isMesh) object.frustumCulled = false; });
            // Every variant shares the same source units/origin. Never center by
            // animated bounds: a raised hand must not shift or resize the body.
            const scale = SOMANGI_HEIGHT / 1.95;
            model.scale.setScalar(scale);
            model.updateMatrixWorld(true);
            model.position.y = -new THREE.Box3().setFromObject(model).min.y;
            const mixer = new THREE.AnimationMixer(model);
            const clip = gltf.animations.find(animation => animation.name === definition.clip);
            if (!clip) throw new Error(`Missing Somangi clip: ${definition.clip}`);
            const action = mixer.clipAction(clip);
            model.visible = false;
            this.root.add(model);
            this.variants.set(name, { model, mixer, action });
            mixer.addEventListener('finished', () => {
                if (this.state === name) {
                    this.setState(this.town.playerController.isMoving && !this.blocked() ? 'walk' : 'idle');
                }
            });
        }));
        this.setState('idle');
        this.updateHint();
    }

    updateHint() {
        const c = this.town.playerController;
        const mode = c.somangiCrabAuto ? '자동' : c.somangiCrabManual ? '수동' : '꺼짐';
        this.hint.textContent = `${this.controlsHint || 'WASD 이동 · Space 점프 · 1 인사 · 2 먹기'} · 좁은 곳 자동 게걸음 · 3 수동 ${mode}`;
        this.hintMode = mode;
    }

    setControlsHint(text) {
        this.controlsHint = text;
        this.updateHint();
    }

    setState(state) {
        if (state === this.state) return;
        for (const variant of this.variants.values()) {
            variant.mixer.stopAllAction();
            variant.model.visible = false;
        }
        this.state = state;
        this.town.playerController.somangiCrabSuspended = ['wave', 'eat', 'jump'].includes(state);
        const variant = this.variants.get(state === 'idle' ? 'walk' : state);
        if (!variant) return;
        variant.model.visible = true;
        if (state === 'idle') return;
        variant.action.reset();
        const loop = state === 'walk' || state === 'crab';
        variant.action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
        variant.action.clampWhenFinished = true;
        variant.action.play();
        variant.mixer.update(0);
    }

    play(action) {
        if (action === 'crab') {
            const controller = this.town.playerController;
            if (!this.variants.has('crab') || this.blocked() || controller.isResting
                || ['wave', 'eat', 'jump'].includes(this.state)) return false;
            controller.somangiCrabManual = !controller.somangiCrabManual;
            controller.somangiCrab = !!controller.somangiCrabManual || !!controller.somangiCrabAuto;
            this.setState(controller.somangiCrab ? 'crab' : controller.isMoving ? 'walk' : 'idle');
            this.updateHint();
            return true;
        }
        if (!['wave', 'eat', 'jump'].includes(action) || !this.variants.has(action) || this.blocked()) return false;
        const controller = this.town.playerController;
        if (controller.isResting || (controller.isMoving && action !== 'jump')) return false;
        if (['wave', 'eat', 'jump'].includes(this.state)) return false;
        controller.somangiCrab = false;
        controller.somangiCrabManual = controller.somangiCrabAuto = false;
        this.updateHint();
        this.setState(action);
        return true;
    }

    update(dt) {
        if (!this.variants.size || this.state === 'loading') return;
        const controller = this.town.playerController;
        const moving = controller.isMoving && !this.blocked();
        if ((this.blocked() || controller.isResting) && controller.somangiCrab) {
            controller.somangiCrab = false;
            controller.somangiCrabManual = controller.somangiCrabAuto = false;
            this.updateHint();
            this.setState('idle');
        }
        const hintMode = controller.somangiCrabAuto ? '자동' : controller.somangiCrabManual ? '수동' : '꺼짐';
        if (this.hintMode !== hintMode) this.updateHint();
        if (controller.somangiCrab) this.setState('crab');
        else if (moving && this.state !== 'jump') this.setState('walk');
        else if (this.state === 'walk' || this.state === 'crab') this.setState('idle');
        if (this.blocked() && ['wave', 'eat', 'jump'].includes(this.state)) this.setState('idle');
        const position = controller.renderPosition;
        const distance = Math.hypot(position.x - this.root.position.x, position.y / GROUND_PROJECTION - this.root.position.z);
        this.root.position.set(position.x, 0, position.y / GROUND_PROJECTION);
        this.root.rotation.y = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 }[controller.facing] ?? 0;
        const variant = this.variants.get(this.state === 'idle' ? 'walk' : this.state);
        if (this.state === 'walk') variant.action.timeScale = controller.keysHeld.has('shift') ? 1.5 : 1;
        if (this.state === 'crab') variant.action.timeScale = moving && dt > 0 ? Math.min(3, distance / dt / 13.5) : 0;
        variant?.mixer.update(Math.min(dt, 0.1));
    }
}
