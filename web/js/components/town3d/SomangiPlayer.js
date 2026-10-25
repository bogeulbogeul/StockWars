import { conversationYaw } from './ConversationFacing.js';
import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { recoverTownBody } from './TownBodyMovement.js';
import { SOMANGI_MOVEMENT } from '../../data/somangiMovement.js';
import { SOMANGI_HEIGHT, SOMANGI_REFERENCE_HEIGHT, SOMANGI_FOOT_Y, SOMANGI_MODELS } from '../../data/somangiModels.js';
import { createSomangiControls } from './SomangiControls.js';
import { loadSomangi } from './SomangiAssets.js';
import { SomangiExpressions } from './SomangiExpressions.js';
import { SomangiJump } from './SomangiJump.js';

export class SomangiPlayer {
    constructor(scene, town, layer) {
        this.town = town;
        this.root = new THREE.Group();
        this.root.name = 'somangi-player';
        scene.add(this.root);
        this.variants = new Map();
        this.state = 'loading';
        this.jump = new SomangiJump();
        this.expressions = new SomangiExpressions();
        this.hint = createSomangiControls(layer, action => this.play(action), () => this.blocked());
        this.update();
        this.ready = this.load();
    }
    blocked() {
        return this.town.playerController.scriptedWalking || this.town.containerEl?.classList.contains('hidden') || this.town.buildingInfoOpen || this.town.callbacks?.isInputBlocked?.();
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
    faceCamera(camera) { this.storyYaw = null; this.storyTarget = null; this.storyCamera = camera; }
    holdFacing() {
        this.storyYaw = this.root.rotation.y;
        this.storyTarget = this.storyCamera = null;
    }
    faceTarget(target) {
        this.storyYaw = null;
        if(this.town.playerController.busSeated)return;
        this.update(0);
        this.storyTarget = target; this.storyCamera = null;
        const yaw = conversationYaw(this.root, target);
        if (yaw !== null) this.root.rotation.y = yaw;
    }
    setControlsHint(text) { this.customHint = text; this.updateHint(); }
    updateHint() { this.hint.textContent = this.customHint || 'WASD 이동 · Space 점프 · 2 먹기'; }
    setState(state) {
        if (this.state === state) return;
        if (state !== 'jump') {
            this.jump.cancel(); this.town.playerController.jumpActive = false;
            this.root.position.y = this.town.playerController.supportHeight || 0;
        }
        for (const variant of this.variants.values()) { variant.action.stop(); variant.model.visible = false; }
        this.state = state;
        const variant = this.variants.get(state === 'idle' || state === 'jump' ? 'walk' : state);
        if (!variant) return;
        variant.model.visible = true;
        if (state === 'idle' || state === 'jump') return;
        variant.action.setLoop(state === 'eat' ? THREE.LoopOnce : THREE.LoopRepeat, state === 'eat' ? 1 : Infinity);
        variant.action.clampWhenFinished = state === 'eat'; variant.action.reset().play();
    }
    play(action, { scripted = false } = {}) {
        if (!scripted && this.blocked()) return false;
        if (this.town.playerController.busSeated) {
            if(!scripted||action!=='eat'||!this.town.playerController.activeSeat?.stand())return false;
        }
        if (action === 'jump') {
            const c = this.town.playerController;
            if (!(c.canJumpAt?.(c.charPosX,c.charPosY) ?? c.canStand?.(c.charPosX,c.charPosY) ?? true)) return false;
            if (!this.variants.has('walk') || !['idle', 'walk'].includes(this.state) || this.town.playerController.isResting || !this.jump.start()) return false;
            c.jumpActive = true;
            this.setState('jump'); return true;
        }
        if (action !== 'eat' || !this.variants.has('eat') || this.state === 'walk' || this.state === 'eat' || this.jump.active) return false;
        this.expressionBeforeEat = this.expressionId;
        void this.setExpression('delicious'); this.setState('eat'); return true;
    }
    update(dt = 0) {
        const c = this.town.playerController;
        if(c.busSeated)return;
        if ((c.modelCollisionReady || c.indoorCollisionReady) && !c.isResting && !c.scriptedWalking) recoverTownBody(c);
        c.somangiCrab = c.somangiCrabManual = c.somangiCrabAuto = false;
        c.somangiCrabSuspended = true;
        const p = c.renderPosition;
        if(c.supportHeightAt)c.supportHeight=c.supportHeightAt(p.x,p.y);
        const x = p.x, z = p.y / GROUND_PROJECTION;
        const distance = this.previous ? Math.hypot(x - this.previous.x, z - this.previous.z) : 0;
        this.previous = { x, z };
        const moving = c.scriptedWalking ? c.isMoving !== false : (distance > .02 && distance < 100 && !c.resting);
        if (moving) { this.storyYaw = null; this.storyCamera = null; this.storyTarget = null; }
        this.root.position.set(p.x, (c.supportHeight||0)+this.jump.update(Math.min(Math.max(dt, 0), .1)), p.y / GROUND_PROJECTION);
        c.jumpActive = this.jump.active;
        this.root.rotation.y = this.storyYaw ?? conversationYaw(this.root, this.storyTarget) ?? (this.storyCamera ? Math.atan2(this.storyCamera.position.x - x, this.storyCamera.position.z - z)
            : ({ down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 }[c.facing] ?? 0));
        if (this.state === 'loading') return;
        if (this.state === 'jump') {
            if (!this.jump.active) this.setState(moving ? 'walk' : 'idle');
        } else if (moving && this.state !== 'walk') {
            if (this.state === 'eat') void this.setExpression(this.expressionBeforeEat || 'smile');
            this.setState('walk');
        } else if (!moving && this.state === 'walk') this.setState('idle');
        const variant = this.variants.get(this.state);
        if (variant) {
            const running = c.isRunning || c.keysHeld?.has('shift');
            variant.mixer.timeScale = this.state === 'walk' ? running ? SOMANGI_MOVEMENT.runPlayback : SOMANGI_MOVEMENT.walkPlayback : 1;
            variant.mixer.update(Math.min(dt, .1));
        }
    }
}
