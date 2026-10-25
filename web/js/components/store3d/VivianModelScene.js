import * as THREE from '../../../vendor/three/three.module.js';
import { SOMANGI_MOVEMENT } from '../../data/somangiMovement.js';
import { applyGameLighting } from '../lighting/GameLighting.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { SomangiPlayer } from '../town3d/SomangiPlayer.js';
import { updateSomangiClearance } from '../town3d/SomangiClearance.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { VIVIAN_MODEL_URL, VIVIAN_MODEL_SCALE, VIVIAN_ROOM_BOUNDS, VIVIAN_SPAWN,
    VIVIAN_EXIT_Z, VIVIAN_ROOM_RATIO, vivianCanStand } from '../../data/vivianModelRoom.js';
import { gameKey } from '../../app/GameKeys.js';
import { VivianRoomCamera } from './VivianRoomCamera.js';
import { addVivianShopkeeper } from './VivianShopkeeper.js';
import { installIndoorFurnitureBodies } from '../town3d/IndoorFurnitureBodies.js';
import { recoverTownBody } from '../town3d/TownBodyMovement.js';
import { createCharacterBodies, charactersCanStand } from '../town3d/CharacterBodies.js';
import { SeatInteraction } from '../town3d/SeatInteraction.js';
import { indoorSeatSurfaces } from '../town3d/SeatSurfaces.js';

// Retains the old office's inventory and save state; owns only the new scene.
export class VivianModelScene {
    constructor(container, onExit, onShop) {
        this.onShop = onShop;
        this.onExit = onExit;
        this.active = false;
        this.exitPending = false;
        this.controller = { charPosX: VIVIAN_SPAWN.x, charPosY: VIVIAN_SPAWN.z * GROUND_PROJECTION,
            keysHeld: new Set(), facing: 'up', isMoving: false,
            get renderPosition() { return { x: this.charPosX, y: this.charPosY }; } };
        this.layer = document.createElement('section');
        this.layer.id = 'vivianModelStage';
        this.layer.className = 'home-model-stage hidden';
        this.layer.setAttribute('aria-label', '기둥 장식과 빈 진열대, 냉장고, 포장대가 있는 잡화점 내부');
        this.status = document.createElement('p');
        this.status.className = 'home-model-status';
        this.status.setAttribute('role', 'status');
        this.status.textContent = '잡화점 내부를 불러오는 중…';
        this.layer.append(this.status);
        container.append(this.layer);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.camera = new THREE.PerspectiveCamera(24, 1, 1, 5000);
        this.roomCamera = new VivianRoomCamera(this.camera);
        this.bindInput();
        this.ready = this.initialize().catch(error => {
            this.failed = true;
            this.status.hidden = false;
            this.status.textContent = '잡화점을 불러오지 못했습니다. Esc로 마을로 돌아갈 수 있어요.';
            console.error('Vivian model:', error);
        });
    }

    async initialize() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.domElement.setAttribute('aria-label', '잡화점 내부 3D 화면');
        this.layer.prepend(this.renderer.domElement);
        this.environmentTarget = applyGameLighting(this.scene, this.renderer);
        const gltf = await new GLTFLoader().loadAsync(VIVIAN_MODEL_URL);
        this.room = gltf.scene;
        this.room.name = 'vivian-room';
        this.room.scale.setScalar(VIVIAN_MODEL_SCALE);
        this.room.position.y = -VIVIAN_ROOM_BOUNDS.floorY * VIVIAN_MODEL_SCALE;
        this.room.traverse(object => {
            if (!object.isMesh) return;
            if (object.name === 'Home_Style_Exit') {
                const geometry = object.geometry;
                geometry.computeBoundingBox();
                const positions = geometry.attributes.position;
                const { min, max } = geometry.boundingBox;
                const colors = [];
                for (let i = 0; i < positions.count; i++) {
                    const value = .42 * (max.z - positions.getZ(i)) / (max.z - min.z);
                    colors.push(value, value, value);
                }
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                object.material = new THREE.MeshBasicMaterial({ vertexColors: true });
            }
            if (object.name === 'Wall_Front') object.visible = false;
            // A black-painted entrance end must stay black under room lighting.
            if (object.name === 'Entrance_Floor') object.material.envMapIntensity = 0;
        });
        const carpet = new THREE.Mesh(
            new THREE.BoxGeometry(1.65, .015, .80),
            new THREE.MeshStandardMaterial({ color: 0xe68f7d, roughness: 1 })
        );
        carpet.name = 'Vivian_Entrance_Coral_Carpet';
        carpet.position.set(0, .040, 2.37);
        const carpetBorder = new THREE.Mesh(
            new THREE.BoxGeometry(1.48, .004, .64),
            new THREE.MeshStandardMaterial({ color: 0xefaa96, roughness: 1 })
        );
        carpetBorder.name = 'Vivian_Carpet_Inset';
        carpetBorder.position.y = .0095;
        carpet.add(carpetBorder);
        this.room.add(carpet);
        this.scene.add(this.room);
        this.shopkeeper = await addVivianShopkeeper(this.room);
        this.characterBodies = createCharacterBodies(this.room);
        installIndoorFurnitureBodies(this, (x,z) => vivianCanStand(x,z)
            && charactersCanStand(this.characterBodies,x,z));
        this.roomCamera.update(0, this.room);
        const adapter = { containerEl: this.layer, playerController: this.controller,
            callbacks: { isInputBlocked: () => !this.active || this.blocked() } };
        this.player = new SomangiPlayer(this.scene, adapter, this.layer);
        await this.player.ready;
        this.seatInteraction=new SeatInteraction(this,indoorSeatSurfaces(this.room));
        this.player.setControlsHint('WASD 이동 · F 계산대 이용 · 현관 / Esc 나가기');
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
            if (key === 'f' && !event.repeat && Math.abs(this.controller.charPosX) < 165 * VIVIAN_ROOM_RATIO
                && Math.abs(this.controller.charPosY / GROUND_PROJECTION - 5 * VIVIAN_ROOM_RATIO) < 65 * VIVIAN_ROOM_RATIO) {
                event.preventDefault();
                this.controller.keysHeld.clear();
                this.onShop?.();
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
        this.seatInteraction?.reset();
        this.active = true;
        this.exitPending = false;
        this.layer.classList.remove('hidden');
        document.body.classList.add('home-model-active');
        this.controller.charPosX = VIVIAN_SPAWN.x;
        this.controller.charPosY = VIVIAN_SPAWN.z * GROUND_PROJECTION;
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
        this.renderer.setSize(width, height);
        this.roomCamera.resize(width / height);
    }

    update(dt) {
        this.roomCamera.update(dt, this.room);
        const c = this.controller, keys = c.keysHeld;
        if(this.seatInteraction?.update(dt))return;
        if (this.furnitureBodies) recoverTownBody(c);
        if (this.blocked() || this.exitPending) keys.clear();
        let dx = Number(keys.has('d')) - Number(keys.has('a'));
        let dz = Number(keys.has('s')) - Number(keys.has('w'));
        ({ dx, dz } = this.roomCamera.movement(dx, dz));
        updateSomangiClearance(c, dx, dz, c.charPosX, c.charPosY / GROUND_PROJECTION, this.canStand);
        const length = Math.hypot(dx, dz), speed = c.somangiCrab ? 14 : keys.has('shift') ? SOMANGI_MOVEMENT.indoorRun : SOMANGI_MOVEMENT.indoorWalk;
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
        if (z >= VIVIAN_EXIT_Z && !this.exitPending) void this.exit();
    }

    startLoop() {
        if (this.frame != null) return;
        this.lastTime = performance.now();
        const draw = now => {
            this.frame = null;
            if (!this.active) return;
            this.update(Math.min(.05, (now - this.lastTime) / 1000));
            this.lastTime = now;
            this.renderer.render(this.scene, this.camera);
            if (this.active) this.frame = requestAnimationFrame(draw);
        };
        this.frame = requestAnimationFrame(draw);
    }
}

