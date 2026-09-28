// World-space pixels. Reserve complete silhouettes, including tree canopies.
export const TOWN_WORLD_WIDTH = 3700;
export const TOWN_WORLD_HEIGHT = 2600;
// Temporary camera framing; this is not an asset production specification.
export const TOWN_VIEW_SCALE = 0.72;
export const TOWN_BUILDING_DEPTH = 180;
export const TOWN_PROP_BASE_Y = 1120;
// Scenery stays paused. Reposition the retained street props before enabling it.
export const TOWN_SCENERY_ENABLED = false;

// The approved concept's three rows, with an open central plaza and connected lanes.
// centerX is the artwork center; y is the front ground-contact line.
export const TOWN_BUILDING_PLACEMENTS = {
    home_office_tower: { centerX: 700, y: 870 },
    cipher_securities: { centerX: 1800, y: 950 },
    node_finance: { centerX: 2950, y: 850 },
    vivian_store: { centerX: 460, y: 1530 },
    julian_furniture: { centerX: 1050, y: 1530 },
    midnight_pub: { centerX: 2690, y: 1530 },
    barter_pawn_shop: { centerX: 3280, y: 1530 },
    bit_logistics: { centerX: 650, y: 2260, scale: 1.5 },
    claire_apparel: { centerX: 1540, y: 2260 },
    data_ink_bookstore: { centerX: 2240, y: 2260 }
};

// Coordinates are ground contact points, independent of artwork height.
export function townEntrance(object) {
    return { x: object.entranceX ?? object.x + object.width / 2, y: object.y + 42 };
}
export const TOWN_PROP_POSITIONS = {
    bench_west: 2740,
    billboard_central: 5440,
    bench_east: 7020
};

export const TOWN_LAMP_POSITIONS = [
    120, 840, 1150, 1800, 2100, 2670, 3685,
    4525, 5985, 8090, 9890
];
export const TOWN_TREE_POSITIONS = [900, 2905, 3755, 4595, 7200, 9050];
