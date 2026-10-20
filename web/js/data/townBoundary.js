// Feet stay on the village side of the visible woodland. The southern road
// remains traversable between the two side boundaries.
export const TOWN_BOUNDARY = { minX: 520, maxX: 3010, minY: 700 };

export function insideTownBoundary(x, y, radius = 16) {
    return x >= TOWN_BOUNDARY.minX + radius
        && x <= TOWN_BOUNDARY.maxX - radius
        && y >= TOWN_BOUNDARY.minY + radius;
}
