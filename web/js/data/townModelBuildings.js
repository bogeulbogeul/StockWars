// Interim placement in the existing town's ground-coordinate system.
export const TOWN_MODEL_BUILDINGS = [
    { id: 'home_office_tower', name: '집', file: 'Home-single-eaves.glb', nativeMaterials: true, entranceOffsetX: 48,
        x: 520, y: 880, width: 320, rotation: -0.06 },
    { id: 'settlement_information', name: '정착 안내소', file: 'Information-clean.glb', nativeMaterials: true,
        x: 1250, y: 1980, width: 370, rotation: 0 },
    { id: 'vivian_store', name: '비비안 잡화점', file: 'VivianStore-clean.glb', nativeMaterials: true,
        x: 2070, y: 1040, width: 370, rotation: 0.06 },
    { id: 'julian_furniture', name: '모던 프레임', file: 'FunitueStoreBuilding.glb',
        x: 470, y: 1690, width: 390, rotation: -0.08 },
    { id: 'cipher_securities', name: '사이퍼 증권', file: 'CipherSecurities-clock.glb',
        nativeMaterials: true, clock: true,
        x: 2030, y: 1730, width: 370, rotation: 0.04 },
    { id: 'node_finance', name: '노드 은행', file: 'BankBuilding.glb',
        x: 2620, y: 2030, width: 390, rotation: -0.05 },
    { id: 'midnight_pub', name: '미드나잇 펍', file: 'PubBuilding.glb',
        x: 2350, y: 760, width: 390, rotation: -0.07 },
    { id: 'data_ink_bookstore', name: '데이터 잉크 서점', file: 'BookStoreBuilding.glb',
        x: 2450, y: 1450, width: 350, rotation: 0.08 },
    { id: 'claire_apparel', name: '옷가게', file: 'ClothingStore.glb',
        x: 720, y: 1400, width: 340, rotation: -0.05 }
];

// Temporary tuning for a front-facing village view inspired by the reference.
export const TOWN_CAMERA = { pitchDegrees: 26, fieldOfView: 35 };
export const TOWN_PREVIEW_FRAME = { x: 1500, y: 1640, visibleHeight: 3100, visibleWidth: 4600 };
export const GROUND_PROJECTION = Math.sin(TOWN_CAMERA.pitchDegrees * Math.PI / 180);

export function modelAssetUrl(file) {
    return new URL(`../../assets/buildings/3d/${file}`, import.meta.url).href;
}
