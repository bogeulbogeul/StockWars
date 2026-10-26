import * as THREE from '../../../vendor/three/three.module.js';
import { renderIndoorWithOcclusion } from '../town3d/IndoorOcclusion.js';
import { SOMANGI_MOVEMENT } from '../../data/somangiMovement.js';
import { applyGameLighting } from '../lighting/GameLighting.js';
import { buildCipherLobby } from './CipherLobbyBlockout.js';
import { SomangiPlayer } from '../town3d/SomangiPlayer.js';
import { updateSomangiClearance } from '../town3d/SomangiClearance.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { LOBBY, lobbyCanStand, nearbyLobbyDoor } from '../../data/cipherLobbyRoom.js';
import { gameKey } from '../../app/GameKeys.js';
import { createCharacterBodies, charactersCanStand } from '../town3d/CharacterBodies.js';
import { recoverTownBody } from '../town3d/TownBodyMovement.js';
import { installIndoorFurnitureBodies } from '../town3d/IndoorFurnitureBodies.js';
import { SeatInteraction } from '../town3d/SeatInteraction.js';
import { indoorSeatSurfaces } from '../town3d/SeatSurfaces.js';

// Independent preview scene: the retained 2D brokerage and account state are untouched.
export class CipherLobbyScene {
    constructor(container, onExit, options = {}) {
        this.layout = options.layout || LOBBY;
        this.buildRoom = options.buildRoom || buildCipherLobby;
        this.canStand = options.canStand || lobbyCanStand;
        this.nearbyDoor = options.nearbyDoor || nearbyLobbyDoor;
        this.defaultHint = options.hint || 'WASD 이동 · Shift 달리기 · 2 먹기 · 아래 출입구 / Esc 마을';
        this.roomLabel = options.label || '증권사 로비';
        this.createInteraction = options.createInteraction;
        this.automaticExit = options.automaticExit !== false;
        this.onDoorEnter = options.onDoorEnter;
        this.onConfirm = options.onConfirm;
        const layout = this.layout;
        this.onExit = onExit;
        this.active = false;
        this.exitPending = false;
        this.controller = { charPosX: layout.spawn.x, charPosY: layout.spawn.z * GROUND_PROJECTION,
            keysHeld: new Set(), facing: 'up', isMoving: false,
            get renderPosition() { return { x: this.charPosX, y: this.charPosY }; } };
        this.layer = document.createElement('section');
        this.layer.id = options.stageId || 'cipherLobbyStage';
        this.layer.className = 'cipher-lobby-stage hidden';
        this.layer.setAttribute('aria-label', options.label || '증권사 로비 3D 공간');
        this.status = document.createElement('p');
        this.status.className = 'cipher-lobby-status';
        this.status.setAttribute('role', 'status');
        this.status.textContent = `${this.roomLabel}를 불러오는 중…`;
        this.layer.append(this.status);
        container.append(this.layer);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.camera = new THREE.PerspectiveCamera(layout.camera.fieldOfView, 1, 1, 6000);
        this.bindInput();
        this.ready = this.initialize().catch(error => {
            this.failed = true;
            this.status.hidden = false;
            this.status.textContent = `${this.roomLabel}를 불러오지 못했습니다. Esc로 이전 장소로 돌아갈 수 있어요.`;
            console.error('Cipher lobby:', error);
        });
    }

    async initialize() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.domElement.setAttribute('aria-label', '증권사 로비 3D 화면');
        this.layer.prepend(this.renderer.domElement);
        this.environmentTarget = applyGameLighting(this.scene, this.renderer, true);
        this.room = this.buildRoom(this.scene);
        await Promise.all([this.room.userData.shellReady, this.room.userData.deskReady, this.room.userData.doorsReady,
            this.room.userData.entryMatReady, this.room.userData.agentKReady, this.room.userData.moaReady,
            this.room.userData.boardFrameReady, this.room.userData.seatingReady, this.room.userData.furnitureReady]);
        const adapter = { containerEl: this.layer, playerController: this.controller,
            callbacks: { isInputBlocked: () => !this.active || this.blocked() } };
        this.player = new SomangiPlayer(this.scene, adapter, this.layer);
        await this.player.ready;
        this.characterBodies = createCharacterBodies(this.room);
        const sceneryCanStand = this.canStand;
        this.canStand = (x, z) => sceneryCanStand(x, z)
            && charactersCanStand(this.characterBodies, x, z);
        installIndoorFurnitureBodies(this, this.canStand);
        this.seatInteraction=new SeatInteraction(this,indoorSeatSurfaces(this.room));
        const createInteraction = this.createInteraction || this.room.userData.createInteraction;
        if(createInteraction)this.interaction=await createInteraction(this);
        this.player.setControlsHint(this.defaultHint);
        this.player.root.traverse(object => { if (object.isMesh) object.castShadow = true; });
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
            if(key==='enter' && !event.repeat && this.onConfirm){
                event.preventDefault();event.stopImmediatePropagation();this.onConfirm();return;
            }
            if (key === 'f' && !event.repeat) {
                const door = this.nearbyDoor(this.controller.charPosX, this.controller.charPosY / GROUND_PROJECTION);
                if (door) {
                    event.preventDefault();event.stopImmediatePropagation();
                    this.onDoorEnter?.(door);return;
                }
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
            this.interaction?.onKeyRelease();
        });
        window.addEventListener('blur', () => this.controller.keysHeld.clear());
    }

    show() {
        this.seatInteraction?.reset();
        this.active = true;
        this.exitPending = false;
        this.layer.classList.remove('hidden');
        document.body.classList.add('cipher-lobby-active');
        this.controller.charPosX = this.layout.spawn.x;
        this.controller.charPosY = this.layout.spawn.z * GROUND_PROJECTION;
        this.controller.facing = this.layout.spawn.facing || 'up';
        this.controller.keysHeld.clear();
        this.layer.focus({ preventScroll: true });
        this.resize();
        if (this.player?.state !== 'loading' && this.room && this.player) this.startLoop();
    }

    hide() {
        this.seatInteraction?.reset();
        this.interaction?.reset();
        this.trainingRoomScene?.hide();
        this.simulationRoomScene?.hide();
        this.active = false;
        this.controller.keysHeld.clear();
        this.controller.isMoving = false;
        this.layer.classList.add('hidden');
        document.body.classList.remove('cipher-lobby-active');
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
        const LOBBY = this.layout;
        if (!this.renderer || !this.active) return;
        const width = this.layer.clientWidth, height = this.layer.clientHeight;
        if (!width || !height) return;
        this.renderer.setSize(width, height);
        const aspect = width / height;
        this.camera.aspect = aspect;
        const pitch = THREE.MathUtils.degToRad(LOBBY.camera.pitch);
        const verticalFov = THREE.MathUtils.degToRad(LOBBY.camera.fieldOfView);
        // Fit both room width and projected wall/floor height, including portrait viewports.
        const distance = Math.max(LOBBY.width / (2 * Math.tan(verticalFov / 2) * aspect),
            (LOBBY.camera.fitHeight ?? 690) / (2 * Math.tan(verticalFov / 2)))
            * (LOBBY.camera.framingMargin ?? 1.4);
        this.camera.position.set(0, LOBBY.camera.targetY + Math.sin(pitch) * distance,
            LOBBY.camera.targetZ + Math.cos(pitch) * distance);
        this.camera.lookAt(0, LOBBY.camera.targetY, LOBBY.camera.targetZ);
        this.camera.updateProjectionMatrix();
        this.room?.userData.cameraRig?.setBase(this.camera);
    }

    update(dt) {
        const LOBBY = this.layout;
        const c = this.controller, keys = c.keysHeld;
        if (c.scriptedWalking) {
            this.player?.update(dt); this.room.userData.update?.(dt); return;
        }
        if(this.seatInteraction?.update(dt)){
            this.room.userData.marketBoard?.update(performance.now());
            this.room.userData.update?.(dt);return;
        }
        if (this.furnitureBodies) recoverTownBody(c);
        if (this.blocked() || this.exitPending) keys.clear();
        if(this.interaction?.update(dt)) {
            this.room.userData.marketBoard?.update(performance.now());
            return;
        }
        let dx = Number(keys.has('d')) - Number(keys.has('a'));
        let dz = Number(keys.has('s')) - Number(keys.has('w'));
        updateSomangiClearance(c, dx, dz, c.charPosX, c.charPosY / GROUND_PROJECTION,
            (x, z) => this.canStand(x, z));
        const length = Math.hypot(dx, dz), speed = c.somangiCrab ? SOMANGI_MOVEMENT.indoorWalk * SOMANGI_MOVEMENT.sidewaysFactor : keys.has('shift') ? SOMANGI_MOVEMENT.indoorRun : SOMANGI_MOVEMENT.indoorWalk;
        const oldX = c.charPosX, oldZ = c.charPosY / GROUND_PROJECTION;
        if(length && !this.blocked() && this.interaction?.tryEnter(dx/length,dz/length,oldX,oldZ))return;
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
        if (this.player) {
            const door = this.nearbyDoor(x, z);
            this.player.hint.textContent = door ? door.hint || `F · ${door.label} 들어가기`
                : this.interaction?.idleHint || this.defaultHint;
        }
        this.room.userData.marketBoard?.update(performance.now());
        this.room.userData.update?.(dt);
        if (this.automaticExit && z >= LOBBY.exitZ && Math.abs(x) < LOBBY.exitHalfWidth && !this.exitPending) void this.exit();
    }

    startLoop() {
        if (this.frame != null) return;
        this.lastTime = performance.now();
        const draw = now => {
            this.frame = null;
            if (!this.active) return;
            const dt = Math.min(.05, (now - this.lastTime) / 1000);
            this.update(dt);
            this.lastTime = now;
            const app = window.stockWarsExhibition;
            this.room.userData.cameraRig?.update(this.camera, this.player, dt,
                app?.scenes.place === 'bank' && !app.scenes.bankAwaitingTalk);
            renderIndoorWithOcclusion(this);
            if (this.active) this.frame = requestAnimationFrame(draw);
        };
        this.frame = requestAnimationFrame(draw);
    }
}
