import { packingProductArt } from './packingProductArt.js';
// Vivian inventory artwork: provisional front-view set, not world placement sprites.
const ARTWORK_IDS = new Set(["item_energy_drink","item_premium_rumor","item_crypto_decoder","item_focus_pill","item_stabilizer","item_vitamin_complex","item_logistics_quickpass_1d","item_logistics_quickpass_7d","item_weekly_drink_ration","item_lotto_ticket","item_black_swan_alarm","item_caffeine_shot","item_darknet_key","item_gas_mask","item_escape_capsule"]);

export function getItemArtwork(id) {
    if (id === 'item_lotto_ticket') return 'assets/items/paper-v4/lotto.svg';
    if (id === 'item_premium_rumor') return 'assets/items/paper-v4/sealed-news.svg';
    return ARTWORK_IDS.has(id) ? `assets/items/vivian-front-v1/${id}.png` : null;
}

export function itemIconHtml(item) {
    const packing = packingProductArt(item.id);
    if (packing) return packing;
    const src = getItemArtwork(item.id);
    return src ? `<img class="item-artwork" src="${src}" alt="" draggable="false">` : (item.icon || '📦');
}
