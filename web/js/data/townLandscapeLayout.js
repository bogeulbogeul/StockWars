import { TOWN_MODEL_BUILDINGS } from './townModelBuildings.js';

// The tree definition uses its front edge; its planter center is at (1659, 1205).
export const TOWN_PLAZA = { x: 1659, y: 1205, radiusX: 300, radiusY: 132 };
export const TOWN_ARRIVAL = { x: 1080, y: 2355 };

// Three clear walking lanes with short door approaches and compact corners.
export function villagePathRoutes() {
    const door = id => {
        const building = TOWN_MODEL_BUILDINGS.find(item => item.id === id);
        return [building.x + (building.entranceOffsetX || 0), building.y + 24];
    };
    return [
        [[1750, 2140], [1750, 1590]],
        [[1150, 2330], [1200, 2330], [1200, 2160], [1750, 2160]],
        [[1140, 1000], [1140, 1840], [1750, 1840]],
        [[2400, 980], [2400, 2160], [1750, 2160]],
        [[1140, 1570], [2400, 1570]],
        [[1659, 1570], [1659, 1310]],
        [door('settlement_information'), [1400, 2160], [1750, 2160]],
        [door('julian_furniture'), [850, 1840], [1140, 1840]],
        [door('home_office_tower'), [898, 1000], [1140, 1000]],
        [door('claire_apparel'), [850, 1400], [1140, 1400]],
        [door('vivian_store'), [2150, 1190], [2400, 1190]],
        [door('midnight_pub'), [2600, 980], [2400, 980]],
        [door('data_ink_bookstore'), [2600, 1530], [2400, 1530]],
        [door('cipher_securities'), [2150, 1840], [2400, 1840]],
        [door('node_finance'), [2600, 2160], [2400, 2160]]
    ];
}
