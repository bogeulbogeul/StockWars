export function officePositionBlocked(items, x, y) {
    // OfficeStage draws the player's feet at the centre of its logical cell.
    // Match that render offset before testing furniture footprints.
    x += 0.5;
    y += 0.5;
    const radius = 0.45;
    return items.some(item => {
        if (!item.placed || item.wallFixture) return false;
        const w = item.rotation % 180 ? item.sizeH : item.sizeW;
        const h = item.rotation % 180 ? item.sizeW : item.sizeH;
        return x > item.gridX - radius && x < item.gridX + w + radius
            && y > item.gridY - radius && y < item.gridY + h + radius;
    });
}
export function officeMove(items, x, y, dx, dy) {
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.1));
    for (let i = 0; i < steps; i++) {
        const nx = Math.max(0.22, Math.min(7.78, x + dx / steps));
        const ny = Math.max(0.22, Math.min(7.78, y + dy / steps));
        if (!officePositionBlocked(items, nx, y)) x = nx;
        if (!officePositionBlocked(items, x, ny)) y = ny;
    }
    return { x, y };
}
