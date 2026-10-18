// Front ground-contact coordinates. Keep doors and the central walking lane clear.
export const TOWN_MODEL_PROPS = [
    { id: 'village_bus_stop', name: '마을 입구 정류장', file: 'BusStop.glb',
        x: 300, y: 1640, width: 300, rotation: 0 },
    { id: 'plaza_tree', name: '광장 큰 나무', file: 'BigTree.glb',
        x: 1300, y: 1190, width: 340, rotation: 0 },
    { id: 'home_garden_tree', name: '집 앞 나무', file: 'Tree.glb',
        x: 650, y: 1030, width: 170, rotation: 0 },
    { id: 'shop_garden_tree', name: '상점가 나무', file: 'Tree.glb',
        x: 1760, y: 1050, width: 170, rotation: 0 },
    { id: 'plaza_flowers_west', name: '쉼터 서쪽 꽃', file: 'Flower.glb',
        x: 1100, y: 1240, width: 60, rotation: 0 },
    { id: 'plaza_flowers_east', name: '쉼터 동쪽 꽃', file: 'Flower.glb',
        x: 1500, y: 1240, width: 60, rotation: 0 },
    { id: 'home_flowers', name: '집 옆 꽃', file: 'Flower.glb',
        x: 500, y: 1110, width: 60, rotation: 0 },
    { id: 'shop_flowers', name: '상점가 꽃', file: 'Flower.glb',
        x: 1840, y: 1110, width: 60, rotation: 0 },
    { id: 'plaza_bench_west', name: '쉼터 서쪽 벤치', file: 'Bench.glb',
        x: 1040, y: 1340, width: 140, rotation: 0 },
    { id: 'plaza_bench_east', name: '쉼터 동쪽 벤치', file: 'Bench.glb',
        x: 1560, y: 1340, width: 140, rotation: 0 },
    { id: 'plaza_notice_board', name: '주민 게시판', file: 'NoticeBoard.glb',
        x: 900, y: 1150, width: 110, rotation: 0 },
    { id: 'shop_ad_board', name: '상점가 광고판', file: 'AdBoard.glb',
        x: 1960, y: 1200, width: 150, rotation: 0 }
];

export function propAssetUrl(file) {
    return new URL(`../../assets/props/3d/${file}`, import.meta.url).href;
}
