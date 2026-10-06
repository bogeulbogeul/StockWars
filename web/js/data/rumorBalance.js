export const RUMOR_BALANCE = {
    common: { weight: 50, price: 500 },
    uncommon: { weight: 28, price: 1200 },
    rare: { weight: 15, price: 2000 },
    epic: { weight: 6, price: 6000 },
    legendary: { weight: 1, price: 15000 }
};

// Rebalance existing events without replacing their interpretation texts.
export const RUMOR_RARITY_OVERRIDES = {
    item_studioluna_rumor: 'uncommon',
    item_cloudberry_fire_rumor: 'uncommon',
    item_stardust_contract_rumor: 'rare',
    item_stardust_scandal_rumor: 'uncommon',
    item_forestlab_approval_rumor: 'rare',
    item_forestlab_side_effect_rumor: 'uncommon'
};
