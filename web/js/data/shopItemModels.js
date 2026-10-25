// Current refined shop assets. Legacy item IDs preserve inventory and saves.
export const SHOP_ITEM_MODEL_IDS = Object.freeze([
    "item_honey_cookie",
    "item_petal_tea",
    "item_apple_juice",
    "item_popori_bread",
    "item_berry_juice",
    "item_herb_tea",
    "item_dew_jelly",
    "item_honey_candy",
    "item_crypto_decoder",
    "item_moon_powder",
    "item_lotto_ticket",
    "item_premium_rumor"
]);
export function shopItemModelUrl(id) {
    return SHOP_ITEM_MODEL_IDS.includes(id)
        ? new URL(`../../assets/items/3d/refined-v2/${id}.glb`, import.meta.url).href : null;
}
