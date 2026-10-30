import { conversationYaw, faceConversationPartner } from './ConversationFacing.js';
import { somangiFacingYaw, setSomangiFacing } from './SomangiFacing.js';
import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { recoverTownBody } from './TownBodyMovement.js';
import { SOMANGI_MOVEMENT } from '../../data/somangiMovement.js';
import { SOMANGI_HEIGHT, SOMANGI_REFERENCE_HEIGHT, SOMANGI_FOOT_Y, SOMANGI_MODELS } from '../../data/somangiModels.js';
import { createSomangiControls } from './SomangiControls.js';
import { loadSomangi } from './SomangiAssets.js';
import { SomangiExpressions } from './SomangiExpressions.js';
import { SomangiJump } from './SomangiJump.js';
import { updateSomangiClearance, sidewaysYaw } from './SomangiClearance.js';
import { SomangiEatingFood, hideEmbeddedBread } from './SomangiEatingFood.js';

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
        this.food = new SomangiEatingFood(this);
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
            if (name === 'eat') hideEmbeddedBread(model);
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
        this.storyYaw = somangiFacingYaw(this.root);
        this.storyTarget = this.storyCamera = null;
    }
    faceTarget(target) {
        this.storyYaw = null;
        if(this.town.playerController.busSeated)return;
        this.update(0);
        this.storyTarget = target; this.storyCamera = null;
        const yaw = conversationYaw(this.root, target);
        if (yaw !== null) setSomangiFacing(this.root, yaw);
        faceConversationPartner(target, this.root);
    }
    setControlsHint(text) { this.customHint = text; this.updateHint(); }
    updateHint() { this.hint.textContent = this.customHint || 'WASD 이동 · Space 점프 · 2 먹기'; }
    setState(state) {
        if (this.state === state) return;
        if (this.state === 'eat') this.food.clear();
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
    play(action, { scripted = false, foodId = 'item_popori_bread', foodObject } = {}) {
        if (!scripted && this.blocked()) return false;
        if (this.town.playerController.busSeated) {
            if(!scripted||action!=='eat'||!this.town.playerController.activeSeat?.stand())return false;
        }
        if (action === 'jump') {
            const c = this.town.playerController;
            if (!(c.canJumpAt?.(c.charPosX,c.charPosY) ?? c.canStand?.(c.charPosX,c.charPosY) ?? true)) return false;
            if (!this.variants.has('walk') || !['idle', 'walk', 'sideways'].includes(this.state) || this.town.playerController.isResting || !this.jump.start()) return false;
            c.jumpActive = true;
            this.setState('jump'); return true;
        }
        if (action !== 'eat' || !this.variants.has('eat') || this.state === 'walk' || this.state === 'sideways' || this.state === 'eat' || this.jump.active) return false;
        this.expressionBeforeEat = this.expressionId;
        void this.setExpression('delicious'); this.setState('eat'); this.food.start(foodId, foodObject); return true;
    }
    update(dt = 0) {
        const c = this.town.playerController;
        if(c.busSeated){c.somangiCrab=false;c.somangiCrabAuto=false;return;}
        if ((c.modelCollisionReady || c.indoorCollisionReady) && !c.isResting && !c.scriptedWalking) recoverTownBody(c);
        c.somangiCrabManual = false;
        c.somangiCrabSuspended = this.state === 'loading' || this.state === 'eat';
        const p = c.renderPosition;
        if(c.scriptedWalking && Number.isFinite(c.scriptedSupportHeight)) c.supportHeight=c.scriptedSupportHeight;
        else if(c.supportHeightAt)c.supportHeight=c.supportHeightAt(p.x,p.y);
        const x = p.x, z = p.y / GROUND_PROJECTION;
        const dx = this.previous ? x - this.previous.x : 0, dz = this.previous ? z - this.previous.z : 0;
        const distance = Math.hypot(dx, dz);
        this.previous = { x, z };
        const moving = c.scriptedWalking ? c.isMoving !== false : (distance > .02 && distance < 100 && !c.resting);
        if (moving) {
            this.storyYaw = null; this.storyCamera = null; this.storyTarget = null;
            // Indoor/manual controllers may update their facing after this render.
            // Face the actual travel direction and retain it when input stops.
            if (distance > .02 && distance < 100 && !c.somangiCrab) {
                this.travelYaw = Math.atan2(dx, dz);
                c.facing = Math.abs(dx) > Math.abs(dz) ? dx > 0 ? 'right' : 'left' : dz > 0 ? 'down' : 'up';
            }
        }
        this.root.position.set(p.x, (c.supportHeight||0)+this.jump.update(Math.min(Math.max(dt, 0), .1)), p.y / GROUND_PROJECTION);
        c.jumpActive = this.jump.active;
        if (c.canStand) updateSomangiClearance(c, dx, dz, x, z, (px, pz) => c.canStand(px, pz * GROUND_PROJECTION));
        const previousYaw = somangiFacingYaw(this.root);
        faceConversationPartner(this.storyTarget, this.root);
        const yaw = this.storyYaw ?? conversationYaw(this.root, this.storyTarget) ?? (this.storyCamera ? Math.atan2(this.storyCamera.position.x - x, this.storyCamera.position.z - z)
            : (moving && !c.somangiCrab ? this.travelYaw : null)
                ?? ({ down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 }[c.facing] ?? 0));
        setSomangiFacing(this.root, yaw);
        if (c.somangiCrab && this.storyYaw == null && !this.storyTarget && !this.storyCamera) {
            setSomangiFacing(this.root, sidewaysYaw(c.somangiTravelAxis, this.sidewaysFacing ?? previousYaw));
            this.sidewaysFacing = this.root.rotation.y;
        } else this.sidewaysFacing = null;
        if (this.state === 'loading') return;
        const movingState = c.somangiCrab ? 'sideways' : 'walk';
        if (this.state === 'jump') {
            if (!this.jump.active) this.setState(moving ? movingState : 'idle');
        } else if (moving && this.state !== movingState) {
            if (this.state === 'eat') void this.setExpression(this.expressionBeforeEat || 'smile');
            this.setState(movingState);
        } else if (!moving && (this.state === 'walk' || this.state === 'sideways')) this.setState('idle');
        const variant = this.variants.get(this.state);
        if (variant) {
            const running = c.isRunning || c.keysHeld?.has('shift');
            variant.mixer.timeScale = this.state === 'sideways' ? SOMANGI_MOVEMENT.sidewaysPlayback : this.state === 'walk' ? running ? SOMANGI_MOVEMENT.runPlayback : SOMANGI_MOVEMENT.walkPlayback : 1;
            variant.mixer.update(Math.min(dt, .1));
        }
        this.food.update();
    }
}
