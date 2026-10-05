/**
 * Furniture Data & 8x8 Office Housing Catalog
 * GDD Reference: [MOD_GDD_03_2] Julian Furniture & 8x8 Room Specification
 */

export const FURNITURE_CATEGORIES = {
    all: { key: 'all', name: '전체', icon: '🛋️' },
    desk_chair: { key: 'desk_chair', name: '책상 & 의자', icon: '🪑' },
    bed_relax: { key: 'bed_relax', name: '침대 & 휴식', icon: '🛏️' },
    decor: { key: 'decor', name: '조명 & 데코', icon: '💡' },
    storage_wall: { key: 'storage_wall', name: '수납 & 벽장식', icon: '🚪' },
    skin: { key: 'skin', name: '벽지 & 바닥', icon: '🎨' }
};

export const FURNITURE_THEMES = {
    ModernDark: { name: '모던 다크', color: '#00e5ff', icon: '💻' },
    RetroArcade: { name: '레트로 아케이드', color: '#ff007f', icon: '👾' },
    PenthouseGold: { name: '펜트하우스 골드', color: '#ffd600', icon: '✨' },
    NaturalWood: { name: '내추럴 우드', color: '#a1887f', icon: '🪵', displayFilter: 'saturate(0.82) brightness(1.03)' }
};

// Furniture assets will be registered here as they are added.
const basicAsset = (file, width, height, anchorX, anchorY, scale) => ({
    url: new URL(`../../assets/office/basic-furniture-v2/${file}.png`, import.meta.url).href,
    width, height, anchorX, anchorY, scale, insetX: 0.08, insetY: 0.08, rotationMode: 'mirror'
});
export const DEFAULT_FURNITURE_CATALOG = [
    { id: 'basic_oak_desk_v2', name: '기본 오크 책상', category: 'desk_chair', icon: '🪵', sizeW: 2, sizeH: 3, gridX: 1, gridY: 0, asset: basicAsset('desk', 1536, 1024, 995, 976, 0.125) },
    { id: 'basic_oak_chair_v2', name: '기본 오크 의자', category: 'desk_chair', icon: '🪑', sizeW: 1, sizeH: 1, gridX: 3, gridY: 1, asset: basicAsset('chair', 1231, 1278, 620, 1130, 0.086) },
    { id: 'basic_oak_bed_v2', name: '기본 오크 침대', category: 'bed_relax', icon: '🛏️', sizeW: 2, sizeH: 4, gridX: 4, gridY: 3, asset: basicAsset('bed-grid-v3', 1536, 1024, 938, 952, 0.16) },
    { id: 'basic_oak_wardrobe_v2', name: '기본 오크 옷장', category: 'storage_wall', icon: '🚪', sizeW: 1, sizeH: 2, gridX: 0, gridY: 5, asset: basicAsset('wardrobe', 1024, 1536, 620, 1460, 0.108) },
    { id: 'office_door_oak', name: '기본 오크 문', category: 'storage_wall', icon: '🚪', sizeW: 0, sizeH: 0, gridX: 0, gridY: 0, wallFixture: 'isoOfficeDoor', asset: { url: new URL('../../assets/office/basic-openings-v1/door-oak-v2.png', import.meta.url).href } },
    { id: 'office_window_oak', name: '기본 오크 창문', category: 'storage_wall', icon: '🪟', sizeW: 0, sizeH: 0, gridX: 0, gridY: 0, wallFixture: 'isoOfficeWindow', asset: { url: new URL('../../assets/office/basic-openings-v1/window-oak-v3.png', import.meta.url).href } }
].map(item => ({ ...item, theme: 'NaturalWood', scale: 'M', price: 0, buffs: [],
    desc: item.wallFixture ? '벽 설치 에셋 · 고정 위치 · 표시/수납 가능' : '밝은 오크 가구 · 실내 각도 확인용 시안', placed: true, rotation: 0, canRotate: !item.wallFixture }));
