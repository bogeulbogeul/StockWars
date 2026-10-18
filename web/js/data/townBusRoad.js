import { TOWN_MODEL_PROPS } from './townModelProps.js';

const stop = TOWN_MODEL_PROPS.find(prop => prop.id === 'village_bus_stop');

// East-west carriageway in the same flat ground coordinates as the village.
export const TOWN_BUS_ROAD = {
    centerY: stop.y + 150,
    width: 180,
    shoulder: 18,
    stopX: stop.x,
    platformY: stop.y - 12,
    platformWidth: 420,
    entryX: -6000,
    exitX: 10000
};

// Reserved for a later bus animation. No vehicle, timer, fares or boarding yet.
export const TOWN_BUS_ROUTE = {
    entry: { x: TOWN_BUS_ROAD.entryX, y: TOWN_BUS_ROAD.centerY - TOWN_BUS_ROAD.width / 4 },
    stop: { x: stop.x, y: TOWN_BUS_ROAD.centerY - TOWN_BUS_ROAD.width / 4 },
    exit: { x: TOWN_BUS_ROAD.exitX, y: TOWN_BUS_ROAD.centerY - TOWN_BUS_ROAD.width / 4 }
};
