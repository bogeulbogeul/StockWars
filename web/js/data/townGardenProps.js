// Curated lawn pockets around the existing buildings. No new asset downloads.
const trees = [
    ['west_gate', 230, 2250, 165, -0.12],
    ['west_meadow', 170, 1830, 180, 0.22],
    ['west_garden', 190, 1290, 185, -0.17],
    ['home_orchard', 1030, 850, 180, 0.15],
    ['back_grove', 1570, 850, 190, -0.2],
    ['pub_grove', 2750, 850, 165, 0.28],
    ['east_garden', 2910, 1260, 175, -0.08],
    ['book_grove', 2920, 1650, 195, 0.2],
    ['bank_grove', 3060, 2180, 185, -0.2],
    ['entry_grove', 1080, 2340, 160, 0.14],
    ['northwest_grove', 260, 730, 155, -0.1]
];

const flowerBeds = [
    ['home', 295, 980], ['clothing', 530, 1500],
    ['furniture', 270, 1760], ['information', 1010, 2140],
    ['bank', 2850, 2130], ['finance', 2260, 1810],
    ['book', 2650, 1530], ['store', 1830, 1110],
    ['pub', 2550, 920], ['bus_stop', 430, 2290]
];

export const TOWN_GARDEN_PROPS = [
    ...trees.map(([id, x, y, width, rotation]) => ({
        id: `garden_tree_${id}`, name: '정원 나무', file: 'Tree.glb', x, y, width, rotation
    })),
    ...flowerBeds.flatMap(([id, x, y]) => [
        { id: `garden_flowers_${id}_a`, name: '작은 화단', file: 'Flower.glb',
            x: x - 20, y, width: 38, rotation: -0.12 },
        { id: `garden_flowers_${id}_b`, name: '작은 화단', file: 'Flower.glb',
            x: x + 22, y: y + 14, width: 31, rotation: 0.18 }
    ]),
    { id: 'garden_bench_home', name: '주거 구역 벤치', file: 'Bench.glb',
        x: 820, y: 1170, width: 125, rotation: -0.25 },
    { id: 'garden_bench_book', name: '서점 옆 벤치', file: 'Bench.glb',
        x: 2890, y: 1730, width: 125, rotation: 0.12 },
    { id: 'garden_bench_gate', name: '정류장 쉼터 벤치', file: 'Bench.glb',
        x: 1000, y: 2340, width: 125, rotation: 0.1 },
    { id: 'garden_notice_gate', name: '입구 안내 게시판', file: 'NoticeBoard.glb',
        x: 410, y: 2240, width: 90, rotation: -0.08 },
    { id: 'garden_ad_clothing', name: '옷가게 옆 광고판', file: 'AdBoard.glb',
        x: 970, y: 1580, width: 95, rotation: 0.1 }
];
