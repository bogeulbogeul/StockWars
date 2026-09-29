// Placement uses visible artwork bounds; y is the front ground-contact line.
const artwork = {
    hedge: ['LandscapeHedgeBedSimple', 2172, 724, 56, 195, 2056, 350],
    tree: ['LandscapeTreeBedSimple', 1254, 1254, 204, 160, 850, 952],
    fountain: ['FountainBaseSimple', 1254, 1254, 128, 218, 1000, 888],
    bench: ['BenchSimple', 1536, 1024, 78, 158, 1382, 664],
    lamp: ['StreetLampSimple', 1024, 1536, 380, 82, 266, 1378],
    billboard: ['BillboardSimple', 1536, 1024, 112, 134, 1314, 754],
    vending: ['EnergyDrinkVendingMachine', 1024, 1536, 200, 196, 626, 1134]
};
// Shared display sizes per prop family; keep placement centers stable when resizing.
const landscapeSizes = {
    tree: { width: 165, depth: 70 },
    hedge: { width: 180, depth: 30 },
    bench: { width: 180, depth: 35 },
    lamp: { width: 48, depth: 24 }
};
export const TOWN_LANDSCAPE = [
    ['energy_drink_vending', 'vending', 95, 1530, 110, 50],
    ['plaza_fountain', 'fountain', 1660, 1490, 360, 180],
    ['north_west_tree', 'tree', 977.5, 720, 165, 70],
    ['north_east_tree', 'tree', 2287.5, 480, 165, 70],
    ['town_information_board', 'billboard', 2160, 800, 420, 55],
    ['plaza_west_tree', 'tree', 1395, 1495, 165, 75],
    ['plaza_east_tree', 'tree', 2140, 1495, 165, 75],
    ['garden_tree', 'tree', 2937.5, 2090, 165, 70],
    // Leave the entire logistics shutter apron clear, including the south curb.
    ['south_east_hedge', 'hedge', 2930, 2450, 180, 30],
    // Small groups frame distinct gardens while leaving the street entrances open.
    // Symmetric west garden around x=307.5: paired trees and lamps frame a central bench.
    ['west_tree_1', 'tree', 100, 480, 165, 70],
    ['west_tree_2', 'tree', 350, 480, 165, 70],
    ['west_tree_3', 'tree', 100, 720, 165, 70],
    ['west_tree_4', 'tree', 350, 720, 165, 70],
    ['west_office_bench', 'bench', 217.5, 940, 180, 35],
    ['office_garden_tree', 'tree', 1247.5, 720, 165, 70],
    ['office_garden_bench', 'bench', 970, 905, 180, 35],
    ['office_garden_bench_east', 'bench', 1240, 905, 180, 35],
    ['office_garden_hedge', 'hedge', 92.5, 1130, 180, 30],
    ['bank_tree_1', 'tree', 3320, 480, 165, 70],
    ['bank_tree_2', 'tree', 3320, 720, 165, 70],
    ['bank_bench', 'bench', 2280, 960, 180, 35],
    ['bank_hedge', 'hedge', 2690, 950, 180, 30],
    ['bank_hedge_east', 'hedge', 3030, 950, 180, 30],
    ['office_front_hedge', 'hedge', 342.5, 1130, 180, 30],
    ['securities_front_hedge', 'hedge', 1520, 980, 160, 28],
    ['securities_front_hedge_2', 'hedge', 1930, 980, 160, 28],
    ['plaza_bench_west', 'bench', 1450, 1680, 175, 30],
    ['plaza_bench_east', 'bench', 2065, 1680, 175, 30],
    ['plaza_hedge_west', 'hedge', 1370, 1230, 180, 30],
    ['plaza_hedge_east', 'hedge', 2150, 1230, 180, 30],
    ['west_walk_tree_1', 'tree', 100, 1840, 165, 70],
    ['west_walk_tree_2', 'tree', 550, 1840, 165, 70],
    ['west_walk_tree_3', 'tree', 1000, 1840, 165, 70],
    ['east_walk_tree_1', 'tree', 2657.5, 1790, 165, 70],
    ['east_walk_tree_2', 'tree', 3217.5, 1790, 165, 70],
    ['park_tree_west', 'tree', 2657.5, 2090, 165, 70],
    ['park_tree_east', 'tree', 3217.5, 2090, 165, 70],
    ['park_tree_north', 'tree', 2937.5, 1790, 165, 70],
    ['park_bench_west', 'bench', 2650, 2250, 180, 35],
    ['park_bench_east', 'bench', 3210, 2250, 180, 35],
    ['south_hedge_middle', 'hedge', 1280, 2450, 290, 40],
    ['south_hedge_east', 'hedge', 2120, 2450, 290, 40],
    ['south_tree_lane', 'tree', 1130, 2220, 145, 60],
    ['lamp_office_walk', 'lamp', 475, 970, 48, 24],
    ['lamp_office_walk_west', 'lamp', 92, 970, 48, 24],
    ['lamp_bank_walk', 'lamp', 2595, 960, 48, 24],
    ['lamp_plaza_west', 'lamp', 1280, 1790, 48, 24],
    ['lamp_plaza_east', 'lamp', 2385, 1790, 48, 24],
    ['lamp_park_west', 'lamp', 2598, 2250, 48, 24],
    ['lamp_park_east', 'lamp', 3394, 2250, 48, 24]
].map(([id, type, x, y, width, depth]) => {
    const size = landscapeSizes[type];
    if (size) {
        x += (width - size.width) / 2;
        width = size.width;
        depth = size.depth;
    }
    const [file, imageWidth, imageHeight, cropX, cropY, cropWidth, cropHeight] = artwork[type];
    return { id, type, x, y, width, depth, height: width * cropHeight / cropWidth,
        src: new URL(`../../assets/props/topdown-v1/${file}.png`, import.meta.url).href,
        imageWidth, imageHeight, viewBox: `${cropX} ${cropY} ${cropWidth} ${cropHeight}` };
});

// Interactions use the same positions as the visible replacement benches.
export const TOWN_LANDSCAPE_BENCHES = TOWN_LANDSCAPE.filter(p => p.type === 'bench').map(p => ({
    ...p, kind: 'prop', name: '휴식 벤치', icon: '🪑', actionText: '앉기 [F] · 기력 회복은 하루 1회'
}));

export const TOWN_LANDSCAPE_INTERACTIVE = [...TOWN_LANDSCAPE_BENCHES,
    ...TOWN_LANDSCAPE.filter(p => p.type === 'vending').map(p => ({
        ...p, kind: 'prop', name: '에너지 드링크 자판기', icon: '🥤', actionText: '24시간 드링크 구매 [F]'
    }))
];
