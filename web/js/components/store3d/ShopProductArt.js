import * as THREE from '../../../vendor/three/three.module.js';
import { SHOP_ITEM_MODEL_IDS } from '../../data/shopItemModels.js';
import { loadShopItem, fitShopItem } from './ShopItemModels.js';
import { applyGameLighting } from '../lighting/GameLighting.js';

let preparation;
const snapshots = new Map();
let renderer, scene, camera, product;

function draw(source) {
    if (product) scene.remove(product);
    product = fitShopItem(source, { width: 1.6, height: 1.8, depth: 1.15 });
    scene.add(product);
    const bounds = new THREE.Box3().setFromObject(product);
    const center = bounds.getCenter(new THREE.Vector3());
    camera.position.set(center.x + 2.7, center.y + 1.8, center.z + 6);
    camera.lookAt(center);
    camera.updateMatrixWorld(true);
    let half = 0;
    for (const x of [bounds.min.x, bounds.max.x]) {
        for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
                const point = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
                half = Math.max(half, Math.abs(point.x), Math.abs(point.y));
            }
        }
    }
    half *= 1.12;
    Object.assign(camera, { left: -half, right: half, top: half, bottom: -half });
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
}

async function prepare() {
    const sources = await Promise.all(SHOP_ITEM_MODEL_IDS.map(loadShopItem));
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(400, 400);
    renderer.setClearColor(0xfff9ed, 0);
    renderer.domElement.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block';
    renderer.domElement.setAttribute('role', 'img');
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1.25, 1.25, 1.25, -1.25, .01, 100);
    applyGameLighting(scene, renderer);
    for (let i = 0; i < sources.length; i++) {
        draw(sources[i]);
        snapshots.set(SHOP_ITEM_MODEL_IDS[i], renderer.domElement.toDataURL('image/png'));
        // Allow input and painting between expensive transmissive product renders.
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
}

// One WebGL renderer for every catalog card and the selected native 3D product.
// Existing artwork stays usable while loading, including on WebGL failure.
export async function updateShopProductArt(owner) {
    preparation ||= prepare().catch(error => {
        console.warn('Shop 3D preview unavailable; keeping item artwork.', error);
    });
    await preparation;
    if (!snapshots.size) return;
    for (const card of owner.itemsGrid?.querySelectorAll('[data-id]') || []) {
        const art = card.querySelector('.flower-goods-art');
        const src = snapshots.get(card.dataset.id);
        if (!art || !src || art.dataset.modelId === card.dataset.id) continue;
        const check = art.querySelector('.flower-goods-check');
        const image = document.createElement('img');
        image.src = src;
        image.alt = '';
        image.className = 'item-artwork';
        image.draggable = false;
        art.replaceChildren(image, ...(check ? [check] : []));
        art.dataset.modelId = card.dataset.id;
    }
    const selected = owner.selectedItemId;
    if (!snapshots.has(selected) || !owner.drawerItemIcon) return;
    const source = await loadShopItem(selected);
    if (owner.selectedItemId !== selected) return;
    draw(source);
    renderer.domElement.setAttribute('aria-label', `${owner.drawerItemName?.textContent || ''} 3D 상품`);
    renderer.domElement.dataset.modelId = selected;
    owner.drawerItemIcon.replaceChildren(renderer.domElement);
}
