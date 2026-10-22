import { SOMANGI_HEIGHT } from './somangiModels.js';

// Source GLB measurements, before runtime scaling. Somangi remains unchanged.
export const TOWN_OBJECT_HEIGHTS = {
    door: SOMANGI_HEIGHT * 1.25,
    busDoor: SOMANGI_HEIGHT * 1.4,
    shelterClearance: SOMANGI_HEIGHT * 1.4,
    seat: SOMANGI_HEIGHT * .32,
    flower: SOMANGI_HEIGHT * .18,
    tree: SOMANGI_HEIGHT * 2.7,
    popori: SOMANGI_HEIGHT * 6.5,
    noticeBoard: SOMANGI_HEIGHT * 1.5
};

const doorBaselines = {
    home_office_tower: [320, 115.0988],
    settlement_information: [370, 99.6577],
    vivian_store: [370, 105.0850],
    julian_furniture: [448.5, 105.6297],
    cipher_securities: [370, 104.3659],
    node_finance: [390, 109.0978],
    midnight_pub: [390, 93.8552],
    data_ink_bookstore: [350, 96.0223],
    claire_apparel: [340, 105.9140]
};

export function scaleTownBuilding(definition) {
    const [referenceWidth, doorHeight] = doorBaselines[definition.id];
    const width = referenceWidth * TOWN_OBJECT_HEIGHTS.door / doorHeight;
    return { ...definition, width,
        ...(definition.entranceOffsetX === undefined ? {} : {
            entranceOffsetX: definition.entranceOffsetX * width / definition.width
        }) };
}

export function scaleTownProp(definition) {
    let width = definition.width;
    switch (definition.file) {
    case 'Bench-clean.glb': width = TOWN_OBJECT_HEIGHTS.seat * 1.72 / .36; break;
    case 'NoticeBoard-clean.glb': width = TOWN_OBJECT_HEIGHTS.noticeBoard * 2.6 / 2.285; break;
    case 'Popori-refined.glb': width = TOWN_OBJECT_HEIGHTS.popori * 6.689258 / 6.97; break;
    case 'BusStop-clean.glb': width = TOWN_OBJECT_HEIGHTS.shelterClearance * 4.045 / 1.79; break;
    case 'CommonTree-clean.glb':
        width = TOWN_OBJECT_HEIGHTS.tree * 2.37 / 2.857144;
        if (definition.id.startsWith('boundary_tree_')) width *= definition.width / 217;
        break;
    default:
        if (definition.file.startsWith('Flowers-mini-')) {
            width = TOWN_OBJECT_HEIGHTS.flower * .8209885 / .439 * definition.width / 52;
        }
    }
    return { ...definition, width };
}

// Bus door leaf height is 1.325 source units. Wheels use this same uniform scale.
export const TOWN_BUS_MODEL_SCALE = TOWN_OBJECT_HEIGHTS.busDoor / 1.325;
