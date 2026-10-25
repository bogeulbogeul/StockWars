// Current exterior assets; retired models must not be used as fallbacks.
import { scaleTownBuilding } from './townObjectScale.js';
// Placement remains interim in the existing town's ground-coordinate system.
export const TOWN_MODEL_BUILDINGS = [
    { id: 'home_office_tower', name: '소망이네 집', file: 'Home-inset-window.glb', nativeMaterials: true, entranceOffsetX: 36.58373925,
        x: 800, y: 950, width: 320, rotation: 0 },
    { id: 'settlement_information', name: '모아 안내소', file: 'Information-clean.glb', nativeMaterials: true,
        x: 1520, y: 2200, width: 370, rotation: 0 },
    { id: 'vivian_store', name: '봉봉 잡화점', file: 'VivianStore-clean.glb', nativeMaterials: true,
        x: 2700, y: 1430, width: 370, rotation: 0 },
    { id: 'julian_furniture', name: '우디 가구점', file: 'Furniture-clean.glb', nativeMaterials: true, entranceOffsetX: -101.04758541,
        x: 850, y: 1900, width: 448.5, rotation: 0 },
    { id: 'cipher_securities', name: '토리 증권사', file: 'CipherSecurities-clock.glb',
        nativeMaterials: true, clock: true, entranceOffsetX: 13.19098455,
        x: 1750, y: 1000, width: 370, rotation: 0 },
    { id: 'node_finance', name: '차곡 은행', file: 'Bank-clean.glb', nativeMaterials: true,
        x: 2450, y: 2230, width: 390, rotation: 0 },
    { id: 'midnight_pub', name: '도란 쉼터', file: 'Pub-clean.glb', nativeMaterials: true, entranceOffsetX: -10.38525493,
        x: 2700, y: 950, width: 390, rotation: 0 },
    { id: 'data_ink_bookstore', name: '소담 서점', file: 'Bookstore-clean.glb', nativeMaterials: true,
        x: 2700, y: 1900, width: 350, rotation: 0 },
    { id: 'post_office', name: '우체국', file: 'PostOffice.glb', nativeMaterials: true, entranceOffsetX: -91.86875461,
        x: 800, y: 1430, width: 350, rotation: 0 },

].map(scaleTownBuilding);

// Temporary tuning for a front-facing village view inspired by the reference.
export const TOWN_CAMERA = { pitchDegrees: 26, fieldOfView: 35 };
export const TOWN_PREVIEW_FRAME = { x: 1500, y: 1640, visibleHeight: 3100, visibleWidth: 4600 };
export const GROUND_PROJECTION = Math.sin(TOWN_CAMERA.pitchDegrees * Math.PI / 180);

export function modelAssetUrl(file) {
    return new URL(`../../assets/buildings/3d/${file}`, import.meta.url).href;
}
