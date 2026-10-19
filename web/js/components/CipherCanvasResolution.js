// CSS screen size already includes the game's UI zoom. DPR adds physical pixels.
export function cipherCanvasResolution(width, height, dpr, room) {
    if (!(width > 0 && height > 0)) return null;
    const density = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
    const fit = Math.min(width / room.width, height / room.height);
    return {
        width: Math.max(1, Math.round(room.width * fit * density)),
        height: Math.max(1, Math.round(room.height * fit * density))
    };
}
