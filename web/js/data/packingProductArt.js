// Reuse existing approved packing artwork for interim product display; no new bitmap assets.
const atlas = new URL('../../assets/items/packing-v1/items.png', import.meta.url).href;
import { POPORI_BREAD_URL as bread } from './packingArtworkAssets.js';
const regions = {
    item_honey_cookie: [20,40,390,350], item_petal_tea: [440,40,350,350],
    item_apple_juice: [920,35,155,355], item_berry_juice: [1665,25,275,370],
    item_herb_tea: [10,490,410,235], item_crypto_decoder: [450,405,300,355],
    item_moon_powder: [840,405,300,355], item_dew_jelly: [1210,430,340,330], item_honey_candy: [1580,470,410,255]
};
export function packingProductArt(id) {
    if (id === 'item_popori_bread') return `<img class="item-artwork item-artwork-popori-bread" src="${bread}" alt="" draggable="false">`;
    const region = regions[id];
    if (!region) return null;
    const [x,y,w,h] = region;
    return `<svg class="item-artwork" aria-hidden="true" viewBox="0 0 ${w} ${h}"><svg width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" overflow="hidden"><image href="${atlas}" width="2000" height="800"/></svg></svg>`;
}
