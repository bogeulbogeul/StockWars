import { TOWN_GARDEN_PROPS } from './townGardenProps.js';
import { TOWN_BOUNDARY_PROPS } from './townBoundaryProps.js';
import { scaleTownProp } from './townObjectScale.js';
import { TOWN_MODEL_BUILDINGS } from './townModelBuildings.js';

const information = TOWN_MODEL_BUILDINGS.find(building => building.id === 'settlement_information');

// Front ground-contact coordinates. Keep doors and the central walking lane clear.
export const TOWN_MODEL_PROPS = [
    { id: 'village_bus_stop', name: '마을 입구 정류장', file: 'BusStop-clean.glb', nativeMaterials: true,
        x: 1000, y: 2325, width: 300, rotation: 0 },
    { id: 'plaza_tree', name: '포포리 나무', file: 'Popori-refined.glb', nativeMaterials: true,
        x: 1751, y: 1535, width: 460, rotation: 0 },
    { id: 'shop_garden_tree', name: '상점가 나무', file: 'CommonTree-clean.glb', nativeMaterials: true,
        x: 2950, y: 1650, width: 160, rotation: 0 },
    { id: 'plaza_flowers_west', name: '쉼터 서쪽 꽃', file: 'Flowers-mini-original.glb', nativeMaterials: true,
        x: 1450, y: 1570, width: 52, rotation: 0 },
    { id: 'plaza_flowers_east', name: '쉼터 동쪽 꽃', file: 'Flowers-mini-pink.glb', nativeMaterials: true,
        x: 2050, y: 1570, width: 52, rotation: 0 },
    { id: 'home_flowers', name: '집 옆 꽃', file: 'Flowers-mini-lavender.glb', nativeMaterials: true,
        x: 630, y: 1100, width: 52, rotation: 0 },
    { id: 'shop_flowers', name: '상점가 꽃', file: 'Flowers-mini-sky-blue.glb', nativeMaterials: true,
        x: 2920, y: 1530, width: 52, rotation: 0 },
    { id: 'plaza_bench_west', name: '쉼터 서쪽 벤치', file: 'Bench-clean.glb', nativeMaterials: true,
        x: 1450, y: 1610, width: 140, rotation: 0 },
    { id: 'plaza_bench_east', name: '쉼터 동쪽 벤치', file: 'Bench-clean.glb', nativeMaterials: true,
        x: 2050, y: 1610, width: 140, rotation: 0 },
    { id: 'plaza_notice_board', name: '주민 게시판', file: 'NoticeBoard-clean.glb', nativeMaterials: true,
        x: information.x + 310, y: information.y + 10, width: 110, rotation: 0 },
    ...TOWN_GARDEN_PROPS,
    ...TOWN_BOUNDARY_PROPS
].map(scaleTownProp);

export function propAssetUrl(file) {
    return new URL(`../../assets/props/3d/${file}`, import.meta.url).href;
}
