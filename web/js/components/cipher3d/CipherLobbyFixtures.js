import * as THREE from '../../../vendor/three/three.module.js';
import { marketEngine } from '../../engine/marketEngine.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';
import { drawCipherIndex } from './CipherIndexDisplay.js';
import { addCozyFacilityDoor } from './CipherCozyDoors.js';
import { addCipherIndexBoardFrame } from './CipherIndexBoardFrame.js';

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

export class CipherMarketBoard {
    constructor(room, box) {
        const z = -LOBBY.depth / 2;
        room.userData.boardFrameReady = addCipherIndexBoardFrame(room);
        this.display = screen(room, 'market-board-screen', 440, 160, 0, 190, z + 21, 1760, 640);
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
    room.userData.doorsReady = Promise.all(LOBBY.doors.map(door => addCozyFacilityDoor(room,door)));
    return new CipherMarketBoard(room, box);
}
