// Calibrated to the current room illustration, not a global art projection rule.
export const ROOM_GRID = { size: 8, x: 768, y: 345, halfWidth: 85, halfHeight: 41 };
export function gridToScreen(u, v) {
    return { x: ROOM_GRID.x + (u - v) * ROOM_GRID.halfWidth,
        y: ROOM_GRID.y + (u + v) * ROOM_GRID.halfHeight };
}
export function screenToGrid(x, y) {
    const a = (x - ROOM_GRID.x) / ROOM_GRID.halfWidth;
    const b = (y - ROOM_GRID.y) / ROOM_GRID.halfHeight;
    return { u: (a + b) / 2, v: (b - a) / 2 };
}
export function footprintCells(item) {
    const cells = [];
    for (let u = item.u; u < item.u + item.w; u++) {
        for (let v = item.v; v < item.v + item.h; v++) cells.push({ u, v });
    }
    return cells;
}
export function cellKey(u, v) { return `${u},${v}`; }
export function blockedCells(items) {
    const cells = new Set();
    for (const item of items.filter(i => i.kind === 'floor')) {
        footprintCells(item).forEach(({u, v}) => cells.add(cellKey(u, v)));
    }
    return cells;
}
export function insideGrid(u, v) {
    return u >= 0 && v >= 0 && u < ROOM_GRID.size && v < ROOM_GRID.size;
}
export function routeCells(start, end, blocked) {
    if (!insideGrid(start.u, start.v) || !insideGrid(end.u, end.v)
        || blocked.has(cellKey(start.u, start.v)) || blocked.has(cellKey(end.u, end.v))) return null;
    const queue = [start], parents = new Map([[cellKey(start.u, start.v), null]]);
    for (let index = 0; index < queue.length; index++) {
        const cell = queue[index];
        if (cell.u === end.u && cell.v === end.v) {
            const path = [];
            for (let at = cell; at; at = parents.get(cellKey(at.u, at.v))) path.unshift(at);
            return path;
        }
        for (const [du, dv] of [[1,0], [0,1], [-1,0], [0,-1]]) {
            const next = {u: cell.u + du, v: cell.v + dv}, key = cellKey(next.u, next.v);
            if (insideGrid(next.u, next.v) && !blocked.has(key) && !parents.has(key)) {
                parents.set(key, cell); queue.push(next);
            }
        }
    }
    return null;
}
export function interactionCells(items) {
    const carpet = items.find(i => i.id === 'carpet'), counter = items.find(i => i.id === 'counter');
    return { exit: {u: carpet.u, v: carpet.v},
        shop: {u: counter.u + counter.w, v: counter.v + counter.h - 1} };
}
export function validateLayout(items) {
    const occupied = new Set(), wallOccupied = new Set();
    for (const item of items) {
        if (![item.u, item.v, item.w, item.h].every(Number.isInteger)) return '칸 좌표가 올바르지 않습니다.';
        if (item.u < 0 || item.v < 0 || item.u + item.w > 8 || item.v + item.h > 8) return '룸 밖에는 놓을 수 없습니다.';
        if (item.kind === 'carpet' && item.u + item.w !== 8) return '출입 카펫은 앞쪽 오른쪽 가장자리에 놓아주세요.';
        if (item.kind === 'wall') {
            if (item.wall === 'left' ? item.u !== 0 : item.v !== 0) return '벽 장식은 벽을 따라 배치하세요.';
            for (const {u,v} of footprintCells(item)) {
                const key = `${item.wall}:${u},${v}`;
                if (wallOccupied.has(key)) return '같은 벽의 다른 장식과 겹칩니다.';
                wallOccupied.add(key);
            }
            continue;
        }
        for (const {u, v} of footprintCells(item)) {
            const key = cellKey(u, v);
            if (occupied.has(key)) return '다른 가구 또는 출입구와 겹칩니다.';
            occupied.add(key);
        }
    }
    const blocked = blockedCells(items), places = interactionCells(items);
    if (!routeCells(places.exit, places.shop, blocked)) return '출입구에서 계산대로 가는 통로를 남겨주세요.';
    return '';
}
export function polygonPoints(u, v, w = 1, h = 1) {
    return [[u,v], [u+w,v], [u+w,v+h], [u,v+h]].map(([a,b]) => {
        const point = gridToScreen(a,b); return `${point.x},${point.y}`;
    }).join(' ');
}
export function createRoomNavigation(items) {
    const blocked = blockedCells(items);
    const free = [];
    for (let u=0; u<8; u++) for (let v=0; v<8; v++) {
        if (!blocked.has(cellKey(u,v))) free.push({u,v,...gridToScreen(u+.5,v+.5)});
    }
    const isWalkable = (x,y) => {
        const {u,v} = screenToGrid(x,y);
        return insideGrid(u,v) && !blocked.has(cellKey(Math.floor(u),Math.floor(v)));
    };
    const clamp = (x,y) => {
        if (isWalkable(x,y)) return {x,y};
        const nearest = free.reduce((best,c) => Math.hypot(c.x-x,c.y-y) < Math.hypot(best.x-x,best.y-y) ? c : best);
        return {x:nearest.x,y:nearest.y};
    };
    const route = (from,to) => {
        const a = screenToGrid(from.x,from.y), b = screenToGrid(to.x,to.y);
        const cells = routeCells({u:Math.floor(a.u),v:Math.floor(a.v)}, {u:Math.floor(b.u),v:Math.floor(b.v)}, blocked);
        if (!cells) return [];
        // Start at the current cell centre so the first segment cannot cut a blocked corner.
        return [...cells.map(c => gridToScreen(c.u+.5,c.v+.5)), to];
    };
    const cells = interactionCells(items);
    const places = ['exit','shop'].map(action => ({...gridToScreen(cells[action].u+.5,cells[action].v+.5),
        action, label:action === 'exit' ? '나가기' : '계산대'}));
    return {isWalkable,clamp,route,places};
}
