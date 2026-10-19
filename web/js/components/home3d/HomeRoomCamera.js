import * as THREE from '../../../vendor/three/three.module.js';
import { HOME_MODEL_SCALE } from '../../data/homeModelRoom.js';

// Quarter turns preserve room coordinates; only camera and near-wall visibility change.
export class HomeRoomCamera {
    constructor(camera) {
        this.camera = camera;
        this.yaw = this.targetYaw = Math.atan2(.9, 3.92);
        this.radius = Math.hypot(.9, 3.92) * HOME_MODEL_SCALE;
        this.target = new THREE.Vector3(0, .325 * HOME_MODEL_SCALE, .08 * HOME_MODEL_SCALE);
        this.update(0);
    }

    rotate(direction) { this.targetYaw += direction * Math.PI / 2; }

    update(dt, room) {
        this.yaw += (this.targetYaw - this.yaw) * (1 - Math.exp(-12 * dt));
        this.camera.position.set(Math.sin(this.yaw) * this.radius, 2.7 * HOME_MODEL_SCALE,
            this.target.z + Math.cos(this.yaw) * this.radius);
        this.camera.lookAt(this.target);
        if (!room) return;
        const x = Math.sin(this.yaw), z = Math.cos(this.yaw);
        for (const [name, near] of [['Wall_Front', z > .35], ['Wall_Back', z < -.35],
            ['Wall_Right', x > .35], ['Wall_Left', x < -.35]]) {
            const wall = room.getObjectByName(name);
            if (wall) wall.visible = !near;
        }
    }

    movement(dx, dz) {
        const cos = Math.cos(this.yaw), sin = Math.sin(this.yaw);
        return { dx: dx * cos + dz * sin, dz: -dx * sin + dz * cos };
    }
}
