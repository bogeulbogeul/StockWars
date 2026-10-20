// Curated lawn pockets around the existing buildings. No new asset downloads.
const trees = [
    ['west_gate', 1100, 2050, 150, 0],
    ['west_meadow', 570, 1700, 155, 0],
    ['west_garden', 600, 1240, 150, 0],
    ['home_orchard', 1100, 810, 155, 0],
    ['back_grove', 1500, 940, 165, 0],
    ['tree_grove_a', 1800, 940, 165, 0],
    ['pub_grove', 2850, 850, 160, 0],
    ['book_grove', 2850, 1650, 160, 0],
    ['bank_grove', 2880, 2000, 155, 0]
];

const flowerBeds = [
    ['home', 620, 1000], ['clothing', 620, 1390],
    ['furniture', 570, 1810], ['information', 1130, 2110],
    ['bank', 2870, 2110], ['finance', 2200, 1950],
    ['book', 2820, 1510], ['store', 2280, 1250],
    ['pub', 2850, 950], ['bus_stop', 770, 2330],
    ['tree_west', 1270, 1290], ['tree_east', 2070, 1270],
    ['home_seat', 1440, 1100], ['book_seat', 2930, 1720],
    ['entry', 1640, 2280]
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
        x: 1280, y: 1130, width: 125, rotation: 0 },
    { id: 'garden_bench_book', name: '서점 옆 벤치', file: 'Bench-clean.glb', nativeMaterials: true,
        x: 2810, y: 1740, width: 125, rotation: 0 },
    { id: 'garden_bench_gate', name: '정류장 쉼터 벤치', file: 'Bench-clean.glb', nativeMaterials: true,
        x: 1450, y: 2270, width: 125, rotation: 0 }
];
