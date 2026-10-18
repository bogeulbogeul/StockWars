import { TOWN_MODEL_BUILDINGS } from './townModelBuildings.js';

export const TOWN_PLAZA = { x: 1450, y: 1280, radiusX: 360, radiusY: 190 };
export const TOWN_ARRIVAL = { x: 1300, y: 2190 };

// One arrival spine with short branches; no loops or overlapping parallel roads.
export function villagePathRoutes() {
    const door = id => {
        const building = TOWN_MODEL_BUILDINGS.find(item => item.id === id);
        return [building.x, building.y + 24];
    };
    return [
        [[650, 2334], [1000, 2250], [1550, 2130], [1670, 2000], [1700, 1900], [1680, 1580], [1450, 1450]],
        [door('settlement_information'), [1250, 2040]],
        [door('julian_furniture'), [650, 1770], [900, 1790], [980, 1880], [1010, 2020], [1250, 2040], [1500, 2000], [1670, 2000]],
        [door('home_office_tower'), [700, 1000], [1000, 1060], [1170, 1200]],
        [door('claire_apparel'), [800, 1490], [1000, 1490], [1190, 1400]],
        [door('vivian_store'), [1990, 1150], [1750, 1220]],
        [door('midnight_pub'), [2390, 940], [2230, 1170], [1990, 1150]],
        [door('data_ink_bookstore'), [2220, 1490], [1950, 1450], [1770, 1370]],
        [door('cipher_securities'), [1860, 1810], [1700, 1900]],
        [door('node_finance'), [2400, 2130], [2140, 2070], [1860, 2000], [1700, 1900]]
    ];
}
