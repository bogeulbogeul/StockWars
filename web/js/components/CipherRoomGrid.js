// Calibrated to the 1536x1024 shell. This projection is local to Cipher.
export const CIPHER_ROOM_GRID = {
    size: 16, origin: { x: 768, y: 290 },
    u: { x: 43.25, y: 20.125 }, v: { x: -44.25, y: 24.25 }
};
export function cipherGridToScreen(u, v) {
    const g = CIPHER_ROOM_GRID;
    return { x: g.origin.x + u * g.u.x + v * g.v.x,
        y: g.origin.y + u * g.u.y + v * g.v.y };
}
export function cipherFloorSvg() {
    const tiles = [];
    for (let u = 0; u < CIPHER_ROOM_GRID.size; u++) {
        for (let v = 0; v < CIPHER_ROOM_GRID.size; v++) {
            const points = [[u,v],[u+1,v],[u+1,v+1],[u,v+1]]
                .map(([a,b]) => { const p = cipherGridToScreen(a,b); return `${p.x},${p.y}`; }).join(' ');
            tiles.push(`<polygon points="${points}" fill="${(u+v)%2 ? '#ecddc1' : '#fff1d8'}" stroke="#d5c5aa" stroke-width="1"/>`);
        }
    }
    return `<svg class="cipher-lobby-shell" viewBox="0 0 1536 1024" role="img" aria-label="사이퍼 증권 로비, 16×16 타일 그리드">
        <defs><clipPath id="cipher-floor-clip"><path d="M768 290 L910 356 L938 385 L938 453 L1024 504 L1090 469 L1167 473 L1458 612 L1092 817 L1092 739 L1074 731 L916 820 L916 911 L760 1000 L76 614 Z"/></clipPath></defs>
        <image href="./assets/interiors/cipher/cipher-lobby-shell-v2-draft.png" width="1536" height="1024"/>
        <g clip-path="url(#cipher-floor-clip)">${tiles.join('')}</g>
    </svg>`;
}
