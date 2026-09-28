import { TOWN_BUILDING_PLACEMENTS } from './townLayout.js';

// Visible artwork bounds exclude transparent padding without modifying the originals.
const assets = {
    home_office_tower: ['OfficeBuilding', 1060, 1484, 231, 62, 599, 1349, 0.325],
    bit_logistics: ['Bit', 1774, 887, 80, 124, 1614, 651, 0.93],
    vivian_store: ['VivianStore', 1774, 887, 231, 85, 1338, 718, 0.493],
    julian_furniture: ['MordenFrame', 1536, 1024, 230, 51, 1076, 894, 0.755],
    claire_apparel: ['TailerShop', 1215, 1295, 222, 85, 773, 1110, 0.793],
    data_ink_bookstore: ['BookStore', 1226, 1283, 110, 86, 1008, 1098, 0.162],
    cipher_securities: ['CipherBuilding', 1024, 1536, 32, 40, 960, 1376, 0.5],
    node_finance: ['BankBuilding', 1402, 1122, 186, 50, 1031, 993, 0.5],
    midnight_pub: ['MidnightPub', 1536, 1024, 165, 52, 1204, 902, 0.178],
    barter_pawn_shop: ['BarterPawnShop', 1145, 1374, 159, 103, 828, 1148, 0.203],
};

export function applyBuildingAsset(building) {
    const [file, width, height, x, y, cropWidth, cropHeight, entryRatio] = assets[building.id];
    const placement = TOWN_BUILDING_PLACEMENTS[building.id];
    const scale = placement.scale ?? 1;
    const maxHeight = building.isMainLandmark ? 720 : building.isOfficetel ? 650 : 560;
    const displayHeight = Math.min(maxHeight, building.width * 2 * cropHeight / cropWidth) * scale;
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
            src: new URL(`../../assets/buildings/topdown-v1/${file}.png`, import.meta.url).href,
            width, height, x, y, cropWidth, cropHeight,
            displayWidth
        }
    };
}
