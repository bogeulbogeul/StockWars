import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';

// Opaque foliage behind the individual trees closes trunk gaps and hides the
// empty terrain beyond the playable village. No collision or asset mutation.
export function createTownForestBackdrop() {
    const root = new THREE.Group();
    root.name = 'village-forest-backdrop';
    const materials = [0x658c48, 0x749b51, 0x7fa75b].map(color =>
        new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    const sphere = new THREE.SphereGeometry(1, 24, 18);
    function bank(x, y, width, depth, index) {
        const z = y / GROUND_PROJECTION;
        const height = 290 + (index % 3) * 25;
        const body = new THREE.Mesh(sphere, materials[index % materials.length]);
        body.position.set(x, height * 0.7, z);
        body.scale.set(width * 0.8, height * 0.95, depth * 0.8);
        root.add(body);
        const crown = new THREE.Mesh(sphere, materials[index % materials.length]);
        crown.position.set(x + (index % 2 ? 20 : -20), height * 1.15, z);
        crown.scale.set(width * 0.65, 125, depth * 0.65);
        root.add(crown);
    }
    for (let i = 0; i < 25; i++) bank(140 + i * 135, 380, 175, 410, i);
    for (let i = 0; i < 37; i++) {
        bank(210, 490 + i * 48, 290, 160, i);
        bank(3330, 490 + i * 48, 290, 160, i + 1);
    }
    return root;
}
