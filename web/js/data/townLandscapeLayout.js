import { TOWN_MODEL_BUILDINGS } from './townModelBuildings.js';

// The tree's front edge is 85 ground units south of its planter center.
export const TOWN_PLAZA = { x: 1750, y: 1450, radiusX: 300, radiusY: 132 };
export const TOWN_ARRIVAL = { x: 960, y: 2355 };

// Two gently bending promenades with short door approaches and open lawn.
export function villagePathRoutes() {
    const door = id => {
        const building = TOWN_MODEL_BUILDINGS.find(item => item.id === id);
        return [building.x + (building.entranceOffsetX || 0), building.y + 24];
    };
    return [
        [[1960, 2320], [1960, 1750], [2200, 1750],
            [2200, 1420], [2200, 1160], [1766, 1160], door('cipher_securities')],
        [[960, 2355], [1120, 2355], [1240, 2290], [1520, 2290]],
        [[1240, 2290], [1180, 2000], [1250, 1660], [1250, 1100], [1766, 1160]],
        [[1250, 1490], [1500, 1490]],
        [[2000, 1490], [2180, 1490]],
        [[1750, 1318], [1750, 1158]],
        [[1750, 1578], [1750, 1740]],
        [door('settlement_information'), [1520, 2290], [1960, 2290]],
        [door('julian_furniture'), [850, 1990], [850, 2080], [1180, 2080], [1180, 2000]],
        [door('home_office_tower'), [840, 1060], [1250, 1100]],
        [door('post_office'), [700, 1510], [1250, 1510]],
        [door('vivian_store'), [2700, 1520], [2200, 1540]],
        [door('midnight_pub'), [2700, 1060], [2200, 1160]],
        [door('data_ink_bookstore'), [2700, 1990], [1960, 1990]],
        [door('node_finance'), [2450, 2320], [1960, 2320]],
        // One shared cross-village walk, rather than a second parallel loop.
        [[1250, 1750], [1580, 1730], [1960, 1750]]
    ];
}
