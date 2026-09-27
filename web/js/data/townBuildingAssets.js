// Visible artwork bounds exclude transparent padding without modifying the originals.
const assets = {
    home_office_tower: ['OfficeBuilding', 1060, 1484, 214, 74, 634, 1346],
    bit_logistics: ['Bit', 1774, 887, 50, 208, 1676, 538],
    vivian_store: ['VivianStore', 1774, 887, 88, 96, 1628, 706],
    julian_furniture: ['MordenFrame', 1536, 1024, 118, 66, 1300, 876],
    claire_apparel: ['TailerShop', 1214, 1295, 158, 102, 912, 1090],
    data_ink_bookstore: ['BookStore', 1358, 1159, 148, 100, 1064, 926],
    cipher_securities: ['CipherBuilding', 1024, 1536, 42, 36, 942, 1420],
    node_finance: ['BankBuilding', 1402, 1122, 34, 48, 1334, 998],
    midnight_pub: ['MidnightPub', 1536, 1024, 98, 74, 1342, 852],
    barter_pawn_shop: ['BarterPawnShop', 1145, 1374, 124, 114, 900, 1108]
};

export function applyBuildingAsset(building) {
    const [file, width, height, x, y, cropWidth, cropHeight] = assets[building.id];
    const maxHeight = building.isMainLandmark ? 720 : building.isOfficetel ? 650 : 560;
    const displayHeight = Math.min(maxHeight, building.width * 2 * cropHeight / cropWidth);
    return {
        ...building,
        x: building.x * 1.7,
        width: building.width * 2,
        height: displayHeight,
        asset: {
            src: new URL(`../../assets/buildings/${file}.png`, import.meta.url).href,
            width, height, x, y, cropWidth, cropHeight,
            displayWidth: displayHeight * cropWidth / cropHeight
        }
    };
}
