// Curated lawn pockets around the existing buildings. No new asset downloads.
const trees = [
    ['west_gate', 600, 2100, 145, 0],
    ['west_meadow', 590, 1690, 140, 0],
    ['west_garden', 600, 1210, 140, 0],
    ['home_orchard', 1180, 890, 140, 0],
    ['back_grove', 2320, 870, 140, 0],
    ['pub_grove', 2950, 1120, 140, 0],
    ['book_grove', 2950, 2040, 140, 0],
    ['bank_grove', 2840, 2270, 140, 0]
];

const flowerBeds = [
    ['home', 650, 1080], ['post', 630, 1560],
    ['furniture', 650, 2010], ['information', 980, 2260],
    ['bank', 2670, 2270], ['finance', 2100, 1090],
    ['book', 2900, 2000], ['store', 2900, 1560],
    ['pub', 2900, 1060], ['bus_stop', 770, 2370],
    ['tree_west', 1450, 1550], ['tree_east', 2050, 1550],
    ['home_seat', 1050, 1160], ['book_seat', 2870, 1800],
    ['entry', 1950, 2350]
];

export const TOWN_GARDEN_PROPS = [
    ...trees.map(([id, x, y, width, rotation]) => ({
        id: `garden_tree_${id}`, name: '정원 나무', file: 'CommonTree-clean.glb', nativeMaterials: true, x, y, width, rotation
    })),
    ...flowerBeds.flatMap(([id, x, y], index) =>
        [[-50, -12], [8, 16], [65, -22]].map(([dx, dy], flower) => ({
            id: `garden_flowers_${id}_${flower}`, name: '작은 꽃마당',
            file: ['Flowers-mini-original.glb', 'Flowers-mini-pink.glb', 'Flowers-mini-lavender.glb', 'Flowers-mini-sky-blue.glb'][flower === 1 ? 0 : 1 + index % 3],
            nativeMaterials: true, x: x + dx, y: y + dy + (index % 3 - 1) * 6,
            width: [46, 54, 42][flower], rotation: [-0.16, 0.12, 0.08][flower]
        }))),
    { id: 'garden_bench_home', name: '주거 구역 벤치', file: 'Bench-clean.glb', nativeMaterials: true,
        x: 1050, y: 1200, width: 125, rotation: 0 },
    { id: 'garden_bench_book', name: '서점 옆 벤치', file: 'Bench-clean.glb', nativeMaterials: true,
        x: 2880, y: 1760, width: 125, rotation: 0 },
    { id: 'garden_bench_gate', name: '정류장 쉼터 벤치', file: 'Bench-clean.glb', nativeMaterials: true,
        x: 1460, y: 2450, width: 125, rotation: 0 }
];
