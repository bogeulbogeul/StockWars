const id = short => `item_${short}`;
// Local room metres. Shelves were measured from the actual room GLB.
export const VIVIAN_PRODUCT_PLACEMENTS = [];
function shelf(short, level, z, width = .44) {
    VIVIAN_PRODUCT_PLACEMENTS.push({ id: id(short), fixture: 'shelf',
        position: [-3.53, [.1575, .6975, 1.2375, 1.7775][level], z],
        width: .40, height: level === 3 ? .30 : .40, depth: width, rotation: Math.PI / 2 });
}
// Teas above, bread/cookies at eye level, candy and powders below.
for (const z of [-1.37, -.84, -.31]) shelf('petal_tea', 3, z);
for (const z of [.82, 1.35, 1.88]) shelf('herb_tea', 3, z);
for (const z of [-1.34, -.62, .87, 1.59]) shelf('popori_bread', 2, z, .60);
for (const z of [-1.32, -.60, .88, 1.60]) shelf('honey_cookie', 1, z, .60);
for (const z of [-1.32, -.60]) shelf('honey_candy', 0, z, .58);
for (const z of [.78, 1.12]) shelf('crypto_decoder', 0, z, .28);
for (const z of [1.58, 1.92]) shelf('moon_powder', 0, z, .28);

for (const [offset, drink] of [[0, 'apple_juice'], [1.75, 'berry_juice']]) {
    for (const [level, short] of [[0, drink], [1, drink], [2, 'dew_jelly']]) {
        for (const z of [-.66, .04]) {
            VIVIAN_PRODUCT_PLACEMENTS.push({ id: id(short), fixture: 'fridge',
                position: [3.44, [.6625, 1.0525, 1.4425][level], z + offset],
                width: .40, height: .31, depth: .40, rotation: -Math.PI / 2 });
        }
    }
}

