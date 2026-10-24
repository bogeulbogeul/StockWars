import { CHARACTER_HEIGHT } from './characterScale.js';

// World-space sizes; the camera scales the character and scenery together.
export const TOWN_CHARACTER_HEIGHT = CHARACTER_HEIGHT;
export const TOWN_BUILDING_HEIGHTS = Object.fromEntries(Object.entries({
    home_office_tower: 7, cipher_securities: 8, node_finance: 4,
    vivian_store: 3, julian_furniture: 3.2,
    data_ink_bookstore: 3,
    midnight_pub: 3, barter_pawn_shop: 3.5
}).map(([id, ratio]) => [id, ratio * CHARACTER_HEIGHT]));

export const TOWN_PROP_SIZES = {
    tree: { width: CHARACTER_HEIGHT * 2, depth: 70 },
    hedge: { width: CHARACTER_HEIGHT * 2, depth: 30 },
    bench: { width: CHARACTER_HEIGHT * 1.5, depth: 30 },
    lamp: { width: CHARACTER_HEIGHT * 0.45, depth: 24 },
    vending: { width: CHARACTER_HEIGHT * 0.72, depth: 35 },
    fountain: { width: CHARACTER_HEIGHT * 3.2, depth: 144 }
};
