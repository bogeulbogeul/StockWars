import { cipherGridToScreen } from './CipherGrid.js';

// The rear strip of the desk's 2×3 footprint is reserved for its employee.
export function agentKRectangle(desk) {
    const feet = cipherGridToScreen(desk.u + 0.65, desk.v + 1.5);
    const h = 185, w = h * 1024 / 1536;
    return { x: feet.x - w * 0.52, y: feet.y - h * 0.95, w, h };
}

export function drawAgentK(ctx, image, desk) {
    if (!image?.complete || !image.naturalWidth) return;
    const r = agentKRectangle(desk);
    ctx.drawImage(image, r.x, r.y, r.w, r.h);
}
