import * as THREE from '../../../vendor/three/three.module.js';
import { VIVIAN_ROOM_RATIO } from '../../data/vivianModelRoom.js';

export class VivianRoomCamera {
    constructor(camera) {
        this.camera = camera;
        this.resize(1);
    }
    resize(aspect) {
        this.camera.aspect = aspect;
        this.distance = Math.max(800 * VIVIAN_ROOM_RATIO / aspect, 540 * VIVIAN_ROOM_RATIO)
            / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)) * 1.12;
        this.update();
        this.camera.updateProjectionMatrix();
    }
    update() {
        const target = new THREE.Vector3(0, 105 * VIVIAN_ROOM_RATIO, -30 * VIVIAN_ROOM_RATIO);
        this.camera.position.set(0, target.y + Math.sin(Math.PI / 6) * this.distance,
            target.z + Math.cos(Math.PI / 6) * this.distance);
        this.camera.lookAt(target);
    }
    movement(dx, dz) { return { dx, dz }; }
}
