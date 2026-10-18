import * as THREE from '../../../vendor/three/three.module.js';
import { marketEngine } from '../../engine/marketEngine.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';
import { addArchedLobbyDoor } from './CipherLobbyArchitecture.js';
import { drawCipherIndex } from './CipherIndexDisplay.js';

function screen(room, name, width, height, x, y, z, canvasWidth, canvasHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    mesh.name = name;
    mesh.position.set(x, y, z);
    room.add(mesh);
    return { canvas, texture, mesh, ctx: canvas.getContext('2d') };
}

function addDoor(room, box, door) {
    const groupName = `door-${door.id}`;
    // Build in local front-facing coordinates, then mount flush to a side wall.
    const assembly = new THREE.Group();
    assembly.name = groupName;
    addArchedLobbyDoor(assembly, door.id, box);
    assembly.rotation.y = door.wall === 'left' ? Math.PI / 2 : -Math.PI / 2;
    assembly.position.set((door.wall === 'left' ? -1 : 1) * LOBBY.width / 2, 0, door.z);
    room.add(assembly);
}

export class CipherMarketBoard {
    constructor(room, box) {
        const z = -LOBBY.depth / 2;
        box('market-board-frame', [484, 203, 16], [0, 190, z + 10], 0xf3ead9);
        box('market-board-trim', [458, 177, 6], [0, 190, z + 21], 0x315c80);
        this.display = screen(room, 'market-board-screen', 440, 160, 0, 190, z + 25, 1760, 640);
        this.lastUpdate = -Infinity;
        this.history = [];
        this.update(0);
    }

    update(now) {
        if (now - this.lastUpdate < 1000) return;
        this.lastUpdate = now;
        this.index = marketEngine.stocks.size ? marketEngine.getCipherIndex() : null;
        if (this.day !== marketEngine.day) {
            this.history = [];
            this.day = marketEngine.day;
        }
        const value = Number(this.index?.val);
        if (this.index && Number.isFinite(value)) {
            this.history.push({ time: now, value });
            this.history = this.history.slice(-60);
        }
        drawCipherIndex(this.display, this.index, this.history);
    }
}

export function addLobbyFixtures(room, box) {
    for (const door of LOBBY.doors) addDoor(room, box, door);
    return new CipherMarketBoard(room, box);
}
