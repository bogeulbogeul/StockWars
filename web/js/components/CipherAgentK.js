import { cipherGridToScreen } from './CipherGrid.js';

// The rear strip of the desk's 2×3 footprint is reserved for its employee.
export function agentKRectangle(desk) {
    const feet = cipherGridToScreen(desk.u + 0.65, desk.v + 1.5);
    // 90 base units × the room's 1.8 zoom. Ignore source alpha padding.
    const scale = (90 * 1.8) / (1468 - 85);
    const h = 1536 * scale, w = 1024 * scale;
    return { x: feet.x - 532 * scale, y: feet.y - 1468 * scale, w, h };
}

export function drawAgentK(ctx, image, desk) {
    if (!image?.complete || !image.naturalWidth) return;
    const r = agentKRectangle(desk);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, r.x, r.y, r.w, r.h);
    ctx.restore();
}
