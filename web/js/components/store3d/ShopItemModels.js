import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { shopItemModelUrl } from '../../data/shopItemModels.js';
import { batchShopItem } from './ShopItemBatching.js';

const models = new Map();
export function loadShopItem(id) {
    if (!models.has(id)) {
        const url = shopItemModelUrl(id);
        if (!url) return Promise.reject(new Error(`Unknown shop model: ${id}`));
        models.set(id, new GLTFLoader().loadAsync(url).then(gltf => {
            // Three's screen-space refraction cannot layer two transmissive solids.
            // Keep the colored liquid opaque inside the clear bottle shell.
            gltf.scene.traverse(mesh => {
                if (!mesh.isMesh) return;
                for (const material of [mesh.material].flat()) {
                    if (/^(Golden apple juice|Ruby berry juice)$/.test(material.name)) {
                        material.transmission = 0;
                        material.roughness = .24;
                    }
                }
            });
            return batchShopItem(gltf.scene);
        }));
    }
    return models.get(id);
}

// Fit the complete product, including its wrapper, without altering proportions.
export function fitShopItem(source, { width, height, depth, rotation = 0 }) {
    const item = new THREE.Group();
    item.add(source.clone(true));
    item.rotation.y = rotation;
    item.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(item);
    const size = bounds.getSize(new THREE.Vector3());
    const scale = Math.min(width / size.x, height / size.y, depth / size.z);
    item.scale.setScalar(scale);
    item.updateMatrixWorld(true);
    bounds.setFromObject(item);
    const center = bounds.getCenter(new THREE.Vector3());
    item.position.set(-center.x, -bounds.min.y, -center.z);
    const anchor = new THREE.Group();
    anchor.add(item);
    return anchor;
}
