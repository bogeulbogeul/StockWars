import { getIndoorRenderer, attachIndoorRenderer } from '../town3d/IndoorRenderer.js';
import { FrameBudget } from '../town3d/FrameBudget.js';
import { worldRenderVisible } from '../town3d/WorldRenderVisibility.js';
import * as THREE from '../../../vendor/three/three.module.js';
import { SOMANGI_MOVEMENT } from '../../data/somangiMovement.js';
import { applyGameLighting } from '../lighting/GameLighting.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { SomangiPlayer } from '../town3d/SomangiPlayer.js';
import { updateSomangiClearance } from '../town3d/SomangiClearance.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { HOME_MODEL_URL, HOME_MODEL_SCALE, HOME_ROOM_BOUNDS, HOME_SPAWN,
    HOME_EXIT_Z, homeCanStand } from '../../data/homeModelRoom.js';
import { gameKey } from '../../app/GameKeys.js';
import { HomeRoomCamera } from './HomeRoomCamera.js';
import { installIndoorFurnitureBodies } from '../town3d/IndoorFurnitureBodies.js';
import { recoverTownBody } from '../town3d/TownBodyMovement.js';
import { SeatInteraction } from '../town3d/SeatInteraction.js';
import { indoorSeatSurfaces } from '../town3d/SeatSurfaces.js';
import { createConversationCamera } from '../town3d/ConversationCamera.js';
import { renderIndoorWithOcclusion, prepareIndoorRendering } from '../town3d/IndoorOcclusion.js';

// Retains the old office's inventory and save state; owns only the new scene.
export class HomeModelScene {
    constructor(container, onExit) {
        this.onExit = onExit;
        this.active = false;
        this.exitPending = false;
        this.controller = { charPosX: HOME_SPAWN.x, charPosY: HOME_SPAWN.z * GROUND_PROJECTION,
            keysHeld: new Set(), facing: 'up', isMoving: false,
            get renderPosition() { return { x: this.charPosX, y: this.charPosY }; } };
        this.layer = document.createElement('section');
        this.layer.id = 'homeModelStage';
        this.layer.className = 'home-model-stage hidden';
        this.layer.setAttribute('aria-label', '흰색 벽과 나무마루, 시멘트 현관이 있는 집 내부');
        this.status = document.createElement('p');
        this.status.className = 'home-model-status';
        this.status.setAttribute('role', 'status');
        this.status.textContent = '집 내부를 불러오는 중…';
        this.layer.append(this.status);
        container.append(this.layer);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.camera = new THREE.PerspectiveCamera(24, 1, 1, 5000);
        this.roomCamera = new HomeRoomCamera(this.camera);
        this.conversationCamera = createConversationCamera({ fitWidth: true });
        this.bindInput();
        this.ready = this.initialize().catch(error => {
            this.failed = true;
            this.status.hidden = false;
            this.status.textContent = '집을 불러오지 못했습니다. Esc로 마을로 돌아갈 수 있어요.';
            console.error('Home model:', error);
        });
    }

    async initialize() {
        this.renderer = getIndoorRenderer();
        this.frameBudget = new FrameBudget(this.renderer, this.scene);
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.domElement.setAttribute('aria-label', '집 내부 3D 화면');

        this.environmentTarget = applyGameLighting(this.scene, this.renderer);
        const gltf = await new GLTFLoader().loadAsync(HOME_MODEL_URL);
        this.room = gltf.scene;
        this.room.name = 'home-cement-entry';
        this.room.scale.setScalar(HOME_MODEL_SCALE);
        this.room.position.y = -HOME_ROOM_BOUNDS.floorY * HOME_MODEL_SCALE;
        this.room.traverse(object => {
            if (!object.isMesh) return;
            if (object.name === 'Wall_Front') object.visible = false;
            // A black-painted entrance end must stay black under room lighting.
            if (object.name === 'Entrance_Floor') object.material.envMapIntensity = 0;
        });
        this.scene.add(this.room);
        installIndoorFurnitureBodies(this, homeCanStand);
        this.roomCamera.update(0, this.room);
        const adapter = { containerEl: this.layer, playerController: this.controller,
            callbacks: { isInputBlocked: () => !this.active || this.blocked() } };
        this.player = new SomangiPlayer(this.scene, adapter, this.layer);
        await this.player.ready;
        this.seatInteraction=new SeatInteraction(this,indoorSeatSurfaces(this.room));
        this.player.setControlsHint('WASD 이동 · 2 먹기 · Q/E 시점 회전 · 현관 / Esc 나가기');
        prepareIndoorRendering(this);
        this.status.hidden = true;
        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(this.layer);
        this.resize();
        if (this.active) this.startLoop();
    }

    blocked() {
        return !!document.querySelector('dialog[open], .modal-overlay:not(.hidden)')
            || document.body.classList.contains('phone-view-active');
    }

    bindInput() {
        this.layer.tabIndex = -1;
        window.addEventListener('keydown', event => {
            if (!this.active || event.ctrlKey || event.metaKey || event.altKey) return;
            if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
            const key = gameKey(event);
            if (this.blocked()) { this.controller.keysHeld.clear(); return; }
            if (event.code === 'KeyQ' || event.code === 'KeyE') {
                event.preventDefault();
                if (!event.repeat) this.roomCamera.rotate(event.code === 'KeyQ' ? -1 : 1);
                return;
            }
            if (key === 'escape' && !event.repeat) { event.preventDefault(); void this.exit(); return; }
            const action = key;
            if (['w', 'a', 's', 'd', 'shift'].includes(action)) {
                event.preventDefault();
                this.controller.keysHeld.add(action);
            }
        });
        window.addEventListener('keyup', event => {
            const key = gameKey(event);
            this.controller.keysHeld.delete(key);
        });
        window.addEventListener('blur', () => this.controller.keysHeld.clear());
    }

    show() {
        attachIndoorRenderer(this);
        this.seatInteraction?.reset();
        this.active = true;
        this.exitPending = false;
        this.layer.classList.remove('hidden');
        document.body.classList.add('home-model-active');
        this.controller.charPosX = HOME_SPAWN.x;
        this.controller.charPosY = HOME_SPAWN.z * GROUND_PROJECTION;
        this.controller.keysHeld.clear();
        this.layer.focus({ preventScroll: true });
        this.resize();
        if (this.player?.state !== 'loading' && this.room && this.player) this.startLoop();
    }

    hide() {
        this.seatInteraction?.reset();
        this.active = false;
        this.controller.keysHeld.clear();
        this.controller.isMoving = false;
        this.layer.classList.add('hidden');
        document.body.classList.remove('home-model-active');
        cancelAnimationFrame(this.frame);
        this.frame = null;
    }

    async exit() {
        if (this.exitPending) return;
        this.exitPending = true;
        this.controller.keysHeld.clear();
        try { await this.onExit(); }
        finally { this.exitPending = false; }
    }

    resize() {
        if (!this.renderer || !this.active) return;
        const width = this.layer.clientWidth, height = this.layer.clientHeight;
        if (!width || !height) return;
        this.frameBudget.resize(width, height);
        this.renderer.setSize(width, height);
        this.roomCamera.resize(width / height);
    }

    update(dt) {
        this.roomCamera.update(dt, this.room);
        this.room.userData.update?.(dt);
        const c = this.controller, keys = c.keysHeld;
        if (c.scriptedWalking) { this.player?.update(dt); return; }
        if(this.seatInteraction?.update(dt))return;
        if (this.furnitureBodies) recoverTownBody(c);
        if (this.blocked() || this.exitPending) keys.clear();
        let dx = Number(keys.has('d')) - Number(keys.has('a'));
        let dz = Number(keys.has('s')) - Number(keys.has('w'));
        ({ dx, dz } = this.roomCamera.movement(dx, dz));
        updateSomangiClearance(c, dx, dz, c.charPosX, c.charPosY / GROUND_PROJECTION, this.canStand);
        const length = Math.hypot(dx, dz), speed = c.somangiCrab ? SOMANGI_MOVEMENT.indoorWalk * SOMANGI_MOVEMENT.sidewaysFactor : keys.has('shift') ? SOMANGI_MOVEMENT.indoorRun : SOMANGI_MOVEMENT.indoorWalk;
        const oldX = c.charPosX, oldZ = c.charPosY / GROUND_PROJECTION;
        let x = oldX, z = oldZ;
        if (length) {
            dx *= speed * dt / length;
            dz *= speed * dt / length;
            const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 5));
            for (let i = 0; i < steps; i++) {
                if (this.canStand(x + dx / steps, z)) x += dx / steps;
                if (this.canStand(x, z + dz / steps)) z += dz / steps;
            }
            c.facing = Math.abs(dz) >= Math.abs(dx) ? (dz > 0 ? 'down' : 'up') : dx > 0 ? 'right' : 'left';
        }
        c.charPosX = x;
        c.charPosY = z * GROUND_PROJECTION;
        c.isMoving = Math.hypot(x - oldX, z - oldZ) > .001;
        this.player?.update(dt);
        if (z >= HOME_EXIT_Z && !this.exitPending) void this.exit();
    }

    startLoop() {
        if (this.frame != null) return;
        this.lastTime = performance.now();
        const draw = now => {
            this.frame = null;
            if (!this.active) return;
            if (!worldRenderVisible() || this.renderer.domElement.parentNode !== this.layer) {
                this.lastTime = now;
                this.frameBudget.reset();
                this.frame = requestAnimationFrame(draw);
                return;
            }
            this.frameBudget.tick(now);
            const dt = Math.min(.05, (now - this.lastTime) / 1000);
            this.update(dt);
            this.lastTime = now;
            this.conversationCamera.update(this.camera, this.player, this.room.userData.moa, dt);
            this.roomCamera.updateWalls(this.room, Math.atan2(this.camera.position.x, this.camera.position.z));
            renderIndoorWithOcclusion(this);
            if (this.active) this.frame = requestAnimationFrame(draw);
        };
        this.frame = requestAnimationFrame(draw);
    }
}
