export function footprint(item) {
    return item.rotated ? { width: item.height, height: item.width }
        : { width: item.width, height: item.height };
}

export function canPlace(order, item, x, y) {
    if (!item || !order.items.includes(item) || !Number.isInteger(x) || !Number.isInteger(y)) return false;
    const { width, height } = footprint(item);
    if (x < 0 || y < 0 || x + width > order.width || y + height > order.height) return false;
    return order.items.every(other => {
        if (other === item || other.x === null) return true;
        const size = footprint(other);
        return x + width <= other.x || other.x + size.width <= x
            || y + height <= other.y || other.y + size.height <= y;
    });
}

export function placeItem(order, item, x, y) {
    if (!canPlace(order, item, x, y)) return false;
    Object.assign(item, { x, y });
    return true;
}

export function resetOrder(order) {
    order.items.forEach(item => Object.assign(item, { x: null, y: null }));
}

export function isOrderComplete(order) {
    const coveredArea = order.items.reduce((area, item) => area + item.width * item.height, 0);
    return coveredArea === order.width * order.height && order.items.length > 0 && order.items.every(item => item.x !== null
        && canPlace(order, item, item.x, item.y));
}

export function finishOrder(session) {
    if (session.awaitingNext || session.completed >= session.orders.length) return false;
    if (!isOrderComplete(session.orders[session.completed])) return false;
    session.completed++;
    session.awaitingNext = true;
    return true;
}
