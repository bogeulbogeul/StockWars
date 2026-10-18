import { TOWN_GARDEN_PROPS } from './townGardenProps.js';

// Front ground-contact coordinates. Keep doors and the central walking lane clear.
export const TOWN_MODEL_PROPS = [
    { id: 'village_bus_stop', name: '마을 입구 정류장', file: 'BusStop.glb',
        x: 650, y: 2310, width: 300, rotation: 0.06 },
    { id: 'plaza_tree', name: '광장 큰 나무', file: 'BigTree.glb',
        x: 1470, y: 1180, width: 340, rotation: 0 },
    { id: 'home_garden_tree', name: '집 앞 나무', file: 'Tree.glb',
        x: 400, y: 1150, width: 170, rotation: 0 },
    { id: 'shop_garden_tree', name: '상점가 나무', file: 'Tree.glb',
        x: 1920, y: 1370, width: 170, rotation: 0.1 },
    { id: 'plaza_flowers_west', name: '쉼터 서쪽 꽃', file: 'Flower.glb',
        x: 1160, y: 1280, width: 60, rotation: 0 },
    { id: 'plaza_flowers_east', name: '쉼터 동쪽 꽃', file: 'Flower.glb',
        x: 1650, y: 1360, width: 60, rotation: 0 },
    { id: 'home_flowers', name: '집 옆 꽃', file: 'Flower.glb',
        x: 680, y: 970, width: 60, rotation: 0 },
    { id: 'shop_flowers', name: '상점가 꽃', file: 'Flower.glb',
        x: 2220, y: 1170, width: 60, rotation: 0 },
    { id: 'plaza_bench_west', name: '쉼터 서쪽 벤치', file: 'Bench.glb',
        x: 1220, y: 1420, width: 140, rotation: -0.12 },
    { id: 'plaza_bench_east', name: '쉼터 동쪽 벤치', file: 'Bench.glb',
        x: 1640, y: 1450, width: 140, rotation: 0.1 },
    { id: 'plaza_notice_board', name: '주민 게시판', file: 'NoticeBoard.glb',
        x: 1020, y: 1400, width: 110, rotation: -0.07 },
    { id: 'shop_ad_board', name: '상점가 광고판', file: 'AdBoard.glb',
        x: 2350, y: 1660, width: 150, rotation: 0.05 },
    ...TOWN_GARDEN_PROPS
];

export function propAssetUrl(file) {
    return new URL(`../../assets/props/3d/${file}`, import.meta.url).href;
}
