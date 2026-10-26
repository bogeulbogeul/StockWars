import { Box3, Group, Vector3 } from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { shopItemModelUrl } from '../../data/shopItemModels.js';

export const EDIBLE_MODEL_IDS = Object.freeze(['item_honey_cookie', 'item_popori_bread', 'item_dew_jelly',
    'item_honey_candy', 'item_petal_tea', 'item_apple_juice', 'item_berry_juice', 'item_herb_tea']);
const cache = new Map();
function fitFood(content, size, name) {
    const bounds = new Box3().setFromObject(content), center = bounds.getCenter(new Vector3());
    const scale = size / Math.max(...bounds.getSize(new Vector3()).toArray());
    content.scale.setScalar(scale); content.position.copy(center).multiplyScalar(-scale);
    const item = new Group(); item.name = name; item.add(content); return item;
}
export function singleHoneyCookie(source) {
    let selected;
    source.traverse(node => { if (/^Cookie[ _]1$/.test(node.name)) selected = node; });
    if (!selected) throw new Error('꿀쿠키 에셋에서 쿠키 한 개를 찾지 못했어요.');
    const content = new Group(); content.add(selected.clone(true));
    const item = fitFood(content, 22, 'moa-single-honey-cookie');
    item.userData.cookieCount = 1; item.userData.foodId = 'item_honey_cookie'; return item;
}
export async function loadEatingFood(id) {
    if (!EDIBLE_MODEL_IDS.includes(id)) throw new Error(`Unsupported eating food: ${id}`);
    if (!cache.has(id)) cache.set(id, new GLTFLoader().loadAsync(shopItemModelUrl(id)).catch(error => { cache.delete(id); throw error; }));
    const { scene } = await cache.get(id);
    if (id === 'item_honey_cookie') return singleHoneyCookie(scene);
    const content = scene.clone(true);
    // Keep the authored food, omitting trays, paper cups and candy wrappers.
    const remove = [];
    content.traverse(node => {
        if (['item_popori_bread', 'item_dew_jelly', 'item_honey_candy'].includes(id)
            && /paper|wrap|twisted gold fan/i.test(node.name)) remove.push(node);
    });
    remove.forEach(node => node.removeFromParent());
    const item = fitFood(content, id === 'item_honey_candy' ? 13 : id === 'item_dew_jelly' ? 20 : 26, `eating-${id}`);
    item.userData.foodId = id; return item;
}
