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
    for (const placement of VIVIAN_PRODUCT_PLACEMENTS) {
        const item = fitShopItem(sources.get(placement.id), placement);
        item.name = `display-${placement.id}-${group.children.length}`;
        item.userData = { itemId: placement.id, fixture: placement.fixture, decorative: true };
        item.position.set(...placement.position);
        group.add(item);
    }
    // Installed after furniture collision extraction: stock never adds obstacles.
    room.add(group);
    return group;
}
