import { TOWN_BUILDING_PLACEMENTS } from './townLayout.js';
import { TOWN_BUILDING_HEIGHTS } from './townScale.js';
import { EMPTY_CHARACTER_IMAGE } from './characterAsset.js';

// Visible artwork bounds exclude transparent padding without modifying the originals.
const assets = {
    home_office_tower: ['OfficeBuilding-door-v2', 1060, 1484, 230, 62, 600, 1341, 0.338],
    vivian_store: ['VivianStore-door-v3', 1774, 887, 227, 62, 1359, 738, 0.485],
    julian_furniture: ['MordenFrame-single-story-v1', 1536, 1024, 146, 162, 1245, 701, 0.737],
    claire_apparel: ['SalonDeTail-single-story-v3', 1215, 1295, 58, 196, 1101, 919, 0.802],
    data_ink_bookstore: ['BookStore-single-story-v1', 1536, 1024, 76, 140, 1385, 745, 0.157],
    cipher_securities: ['CipherBuilding-door-v2', 1024, 1536, 32, 38, 963, 1383, 0.5],
    node_finance: ['BankBuilding-single-story-v1', 1402, 1122, 98, 264, 1205, 647, 0.5],
    midnight_pub: ['MidnightPub-single-story-v1', 1536, 1024, 70, 186, 1397, 699, 0.197],
    barter_pawn_shop: ['BarterPawnShop-single-story-v1', 1199, 1312, 80, 226, 1039, 895, 0.232],
};

export function applyBuildingAsset(building) {
    const [file, width, height, x, y, cropWidth, cropHeight, entryRatio] = assets[building.id];
    const placement = TOWN_BUILDING_PLACEMENTS[building.id];
    const scale = placement.scale ?? 1;
    const displayHeight = TOWN_BUILDING_HEIGHTS[building.id] * scale;
    const displayWidth = displayHeight * cropWidth / cropHeight;
    const slotWidth = building.width * 2 * scale;
    const worldX = placement.centerX - slotWidth / 2;
    return {
        ...building,
        x: worldX,
        y: placement.y,
        width: slotWidth,
        height: displayHeight,
        layoutScale: scale,
        entranceX: worldX + (slotWidth - displayWidth) / 2 + displayWidth * entryRatio,
        asset: {
            src: building.id === 'cipher_securities' ? EMPTY_CHARACTER_IMAGE
                : new URL(`../../assets/buildings/topdown-v1/${file}.png`, import.meta.url).href,
            width, height, x, y, cropWidth, cropHeight,
            displayWidth
        }
    };
}
