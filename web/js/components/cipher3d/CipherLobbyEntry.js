import * as THREE from '../../../vendor/three/three.module.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

export function addLobbyEntry(room) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const fade = ctx.createLinearGradient(0, 0, 0, 128);
    fade.addColorStop(0, 'rgba(202,195,180,1)');
    fade.addColorStop(.3, 'rgba(161,157,147,.9)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0,0,16,128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const length = 110;
    const passage = new THREE.Mesh(new THREE.PlaneGeometry(LOBBY.exitHalfWidth*2,length),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
    passage.name = 'lobby-entry-passage';
    passage.rotation.x = -Math.PI/2;
    passage.position.set(0,-.2,LOBBY.depth/2+length/2-.3);
    room.add(passage);
}
