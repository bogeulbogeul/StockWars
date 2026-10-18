import * as THREE from '../../../vendor/three/three.module.js';
import { buildCipherLobby } from './CipherLobbyBlockout.js';
import { SomangiPlayer } from '../town3d/SomangiPlayer.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { LOBBY, lobbyCanStand, nearbyLobbyDoor } from '../../data/cipherLobbyRoom.js';
import { gameKey } from '../../app/GameKeys.js';

// Independent preview scene: the retained 2D brokerage and account state are untouched.
export class CipherLobbyScene {
    constructor(container, onExit) {
        this.onExit = onExit;
        this.active = false;
        this.exitPending = false;
        this.controller = { charPosX: LOBBY.spawn.x, charPosY: LOBBY.spawn.z * GROUND_PROJECTION,
            keysHeld: new Set(), facing: 'up', isMoving: false,
            get renderPosition() { return { x: this.charPosX, y: this.charPosY }; } };
        this.layer = document.createElement('section');
        this.layer.id = 'cipherLobbyStage';
        this.layer.className = 'cipher-lobby-stage hidden';
        this.layer.setAttribute('aria-label', '증권사 로비 임시 3D 공간');
        this.status = document.createElement('p');
        this.status.className = 'cipher-lobby-status';
        this.status.setAttribute('role', 'status');
        this.status.textContent = '증권사 로비를 불러오는 중…';
        this.layer.append(this.status);
        container.append(this.layer);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.camera = new THREE.PerspectiveCamera(LOBBY.camera.fieldOfView, 1, 1, 6000);
        this.bindInput();
        this.ready = this.initialize().catch(error => {
            this.failed = true;
            this.status.hidden = false;
            this.status.textContent = '로비를 불러오지 못했습니다. Esc로 마을로 돌아갈 수 있어요.';
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
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb9ac98, 1.5));
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(-400, 1400, 800);
        this.scene.add(sun);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        Object.assign(sun.shadow.camera, { left: -800, right: 800, top: 800, bottom: -800, near: 1, far: 3000 });
        sun.shadow.bias = -.0004;
        this.room = buildCipherLobby(this.scene);
        await this.room.userData.entryMatReady;
        const adapter = { containerEl: this.layer, playerController: this.controller,
            callbacks: { isInputBlocked: () => !this.active || this.blocked() } };
        this.player = new SomangiPlayer(this.scene, adapter, this.layer);
        await this.player.ready;
        this.player.hint.textContent = 'WASD / 방향키 이동 · Shift 달리기 · 1 인사 · 2 먹기 · 아래 출입구 / Esc 마을';
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
            if (key === 'f' && !event.repeat) {
                const door = nearbyLobbyDoor(this.controller.charPosX, this.controller.charPosY / GROUND_PROJECTION);
                if (door) { event.preventDefault(); this.onDoorEnter?.(door); return; }
            }
            if (key === 'escape' && !event.repeat) { event.preventDefault(); void this.exit(); return; }
            const action = { arrowup: 'w', arrowdown: 's', arrowleft: 'a', arrowright: 'd' }[key] || key;
            if (['w', 'a', 's', 'd', 'shift'].includes(action)) {
                event.preventDefault();
                this.controller.keysHeld.add(action);
            }
        });
        window.addEventListener('keyup', event => {
            const key = gameKey(event);
            this.controller.keysHeld.delete({ arrowup: 'w', arrowdown: 's', arrowleft: 'a', arrowright: 'd' }[key] || key);
        });
        window.addEventListener('blur', () => this.controller.keysHeld.clear());
    }

    show() {
        this.active = true;
        this.exitPending = false;
        this.layer.classList.remove('hidden');
        document.body.classList.add('cipher-lobby-active');
        this.controller.charPosX = LOBBY.spawn.x;
        this.controller.charPosY = LOBBY.spawn.z * GROUND_PROJECTION;
        this.controller.keysHeld.clear();
        this.layer.focus({ preventScroll: true });
        this.resize();
        if (this.player?.state !== 'loading' && this.room && this.player) this.startLoop();
    }

    hide() {
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
            690 / (2 * Math.tan(verticalFov / 2))) * 1.4;
        this.camera.position.set(0, LOBBY.camera.targetY + Math.sin(pitch) * distance,
            LOBBY.camera.targetZ + Math.cos(pitch) * distance);
        this.camera.lookAt(0, LOBBY.camera.targetY, LOBBY.camera.targetZ);
        this.camera.updateProjectionMatrix();
    }

    update(dt) {
        const c = this.controller, keys = c.keysHeld;
        if (this.blocked() || this.exitPending) keys.clear();
        let dx = Number(keys.has('d')) - Number(keys.has('a'));
        let dz = Number(keys.has('s')) - Number(keys.has('w'));
        const length = Math.hypot(dx, dz), speed = keys.has('shift') ? 220 : 145;
        const oldX = c.charPosX, oldZ = c.charPosY / GROUND_PROJECTION;
        let x = oldX, z = oldZ;
        if (length) {
            dx *= speed * dt / length;
            dz *= speed * dt / length;
            const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 5));
            for (let i = 0; i < steps; i++) {
                if (lobbyCanStand(x + dx / steps, z)) x += dx / steps;
                if (lobbyCanStand(x, z + dz / steps)) z += dz / steps;
            }
            c.facing = Math.abs(dz) >= Math.abs(dx) ? (dz > 0 ? 'down' : 'up') : dx > 0 ? 'right' : 'left';
        }
        c.charPosX = x;
        c.charPosY = z * GROUND_PROJECTION;
        c.isMoving = Math.hypot(x - oldX, z - oldZ) > .001;
        this.player?.update(dt);
        if (this.player) {
            const door = nearbyLobbyDoor(x, z);
            this.player.hint.textContent = door ? `F · ${door.label} 들어가기`
                : 'WASD / 방향키 이동 · Shift 달리기 · 1 인사 · 2 먹기 · 아래 출입구 / Esc 마을';
        }
        this.room.userData.marketBoard?.update(performance.now());
        if (z >= LOBBY.exitZ && Math.abs(x) < LOBBY.exitHalfWidth && !this.exitPending) void this.exit();
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
