// Shared by ordinary play and the exhibition's separate arrival controller.
export function moveTownBody(controller, dx, dy, limits) {
    if(controller.busSeated&&(dx||dy)&&!controller.activeSeat?.stand())return;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
    const legal = (x, y) => (!limits || (x >= limits.minX && x <= limits.maxX
        && y >= limits.minY && y <= limits.maxY)) && controller.canStand(x, y);
    for (let i = 0; i < steps; i++) {
        const x = controller.charPosX + dx / steps;
        if (legal(x, controller.charPosY)) controller.charPosX = x;
        const y = controller.charPosY + dy / steps;
        if (legal(controller.charPosX, y)) controller.charPosY = y;
    }
}

export function recoverTownBody(controller, limits) {
    const { charPosX: x, charPosY: y } = controller;
    if (controller.canStand(x, y)) return false;
    // Test rings in world-ground distance, preferring the front of a solid.
    for (let radius = 4; radius <= 400; radius += 4) {
        for (let i = 0; i < 48; i++) {
            const angle = i * Math.PI * 2 / 48;
            const px = x + Math.sin(angle) * radius;
            const py = y + Math.cos(angle) * radius;
            if (limits && (px < limits.minX || px > limits.maxX || py < limits.minY || py > limits.maxY)) continue;
            if (!controller.canStand(px, py)) continue;
            controller.charPosX = px; controller.charPosY = py;
            return true;
        }
    }
    return false;
}
