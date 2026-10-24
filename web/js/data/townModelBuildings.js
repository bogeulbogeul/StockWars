// Current exterior assets; retired models must not be used as fallbacks.
import { scaleTownBuilding } from './townObjectScale.js';
// Placement remains interim in the existing town's ground-coordinate system.
export const TOWN_MODEL_BUILDINGS = [
    { id: 'home_office_tower', name: '집', file: 'Home-inset-window.glb', nativeMaterials: true, entranceOffsetX: 48,
        x: 850, y: 900, width: 320, rotation: 0 },
    { id: 'settlement_information', name: '정착 안내소', file: 'Information-clean.glb', nativeMaterials: true,
        x: 1400, y: 2050, width: 370, rotation: 0 },
    { id: 'vivian_store', name: '봉봉 잡화점', file: 'VivianStore-clean.glb', nativeMaterials: true,
        x: 2150, y: 1100, width: 370, rotation: 0 },
    { id: 'julian_furniture', name: '모던 프레임', file: 'Furniture-clean.glb', nativeMaterials: true,
        x: 850, y: 1760, width: 448.5, rotation: 0 },
    { id: 'cipher_securities', name: '사이퍼 증권', file: 'CipherSecurities-clock.glb',
        nativeMaterials: true, clock: true,
        x: 2150, y: 1760, width: 370, rotation: 0 },
    { id: 'node_finance', name: '노드 은행', file: 'Bank-clean.glb', nativeMaterials: true,
        x: 2600, y: 2050, width: 390, rotation: 0 },
    { id: 'midnight_pub', name: '미드나잇 펍', file: 'Pub-clean.glb', nativeMaterials: true,
        x: 2600, y: 850, width: 390, rotation: 0 },
    { id: 'data_ink_bookstore', name: '데이터 잉크 서점', file: 'Bookstore-clean.glb', nativeMaterials: true,
        x: 2600, y: 1450, width: 350, rotation: 0 },

].map(scaleTownBuilding);

// Temporary tuning for a front-facing village view inspired by the reference.
export const TOWN_CAMERA = { pitchDegrees: 26, fieldOfView: 35 };
export const TOWN_PREVIEW_FRAME = { x: 1500, y: 1640, visibleHeight: 3100, visibleWidth: 4600 };
export const GROUND_PROJECTION = Math.sin(TOWN_CAMERA.pitchDegrees * Math.PI / 180);

export function modelAssetUrl(file) {
    return new URL(`../../assets/buildings/3d/${file}`, import.meta.url).href;
}
