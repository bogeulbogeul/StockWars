import * as THREE from '../../../vendor/three/three.module.js';
import { loadShopItem, fitShopItem } from './ShopItemModels.js';

import { VIVIAN_PRODUCT_PLACEMENTS } from '../../data/vivianProductPlacements.js';

export async function addVivianProductDisplay(room) {
    // Original empty fridges used opaque blue glass. Let the stocked shelves show.
    room.traverse(mesh => {
        if (!mesh.isMesh || !/^Fridge_Door_Clear_Glass/.test(mesh.name)) return;
        mesh.material = mesh.material.clone();
        mesh.material.transparent = true;
        mesh.material.opacity = .18;
        mesh.material.depthWrite = false;
        mesh.material.metalness = 0;
        mesh.material.roughness = .15;
        if ('transmission' in mesh.material) mesh.material.transmission = 0;
    });
    const group = new THREE.Group();
    group.name = 'vivian-products-decoration';
    const unique = [...new Set(VIVIAN_PRODUCT_PLACEMENTS.map(p => p.id))];
    const sources = new Map(await Promise.all(unique.map(async id => [id, await loadShopItem(id)])));
    const displayMaterials = new Map();
    const displayMaterial = original => {
        if (!original.transmission && !(original.transparent && original.side === THREE.DoubleSide)) return original;
        if (!displayMaterials.has(original)) {
            const material = original.clone();
            if (material.transmission > 0) {
                material.transmission = 0; material.transparent = true;
                material.opacity = Math.min(material.opacity, .28); material.depthWrite = false;
            }
            material.forceSinglePass = true;
            displayMaterials.set(original, material);
        }
        return displayMaterials.get(original);
    };
    for (const placement of VIVIAN_PRODUCT_PLACEMENTS) {
        const item = fitShopItem(sources.get(placement.id), placement);
        item.name = `display-${placement.id}-${group.children.length}`;
        // Shelf-size glass keeps its shell and tint without a full-scene
        // refraction render. The close-up purchase preview keeps its material.
        item.traverse(mesh => {
            if (mesh.isMesh) mesh.material = Array.isArray(mesh.material) ? mesh.material.map(displayMaterial) : displayMaterial(mesh.material);
        });
        item.userData = { itemId: placement.id, fixture: placement.fixture, decorative: true };
        item.position.set(...placement.position);
        group.add(item);
    }
    // Installed after furniture collision extraction: stock never adds obstacles.
    room.add(group);
    return group;
}
