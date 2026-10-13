import { cipherGridToScreen } from './CipherGrid.js';

export const AGENT_K_RECEPTION_URL = new URL('../../assets/characters/agent-k/agent-k-russian-blue-reception-v1.png', import.meta.url).href;
export const AGENT_K_PORTRAIT_URL = new URL('../../assets/characters/agent-k/agent-k-russian-blue-dialogue-v1.png', import.meta.url).href;
// Measured on the new 1024×1536 artwork. H excludes the pointed ears.
export const AGENT_K_ART = { width:1024, height:1536, headTop:340, footY:1448, footX:635 };

// The rear strip of the desk's 2×3 footprint is reserved for its employee.
export function agentKRectangle(desk) {
    const feet = cipherGridToScreen(desk.u + 0.65, desk.v + 1.5);
    // 90 base units × the room's 1.8 zoom. Ignore source alpha padding.
    const scale = (90 * 1.8) / (AGENT_K_ART.footY - AGENT_K_ART.headTop);
    const h = AGENT_K_ART.height * scale, w = AGENT_K_ART.width * scale;
    return { x: feet.x - AGENT_K_ART.footX * scale, y: feet.y - AGENT_K_ART.footY * scale, w, h };
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
