// Interim placement in the existing town's ground-coordinate system.
export const TOWN_MODEL_BUILDINGS = [
    { id: 'home_office_tower', name: '집', file: 'HomeBuilding.glb',
        x: 350, y: 700, width: 320, rotation: 0 },
    { id: 'settlement_information', name: '정착 안내소', file: 'InformationBuilding.glb',
        x: 950, y: 700, width: 370, rotation: 0 },
    { id: 'vivian_store', name: '비비안 잡화점', file: 'StoreBuilding.glb',
        x: 1550, y: 700, width: 370, rotation: 0 },
    { id: 'julian_furniture', name: '모던 프레임', file: 'FunitueStoreBuilding.glb',
        x: 850, y: 1750, width: 390, rotation: 0 },
    { id: 'cipher_securities', name: '사이퍼 증권', file: 'FinanceBuilding.glb',
        x: 1450, y: 1750, width: 370, rotation: 0 },
    { id: 'node_finance', name: '노드 은행', file: 'BankBuilding.glb',
        x: 2050, y: 1750, width: 390, rotation: 0 },
    { id: 'midnight_pub', name: '미드나잇 펍', file: 'PubBuilding.glb',
        x: 2150, y: 700, width: 390, rotation: 0 }
];

// Temporary tuning for a front-facing village view inspired by the reference.
export const TOWN_CAMERA = { pitchDegrees: 26, fieldOfView: 35 };
export const TOWN_PREVIEW_FRAME = { x: 1250, y: 1170, visibleHeight: 2200, visibleWidth: 3300 };
export const GROUND_PROJECTION = Math.sin(TOWN_CAMERA.pitchDegrees * Math.PI / 180);

export function modelAssetUrl(file) {
    return new URL(`../../assets/buildings/3d/${file}`, import.meta.url).href;
}
