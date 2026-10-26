import { project } from './MapData.js';

// Match the world's 100-unit rounded joins before projecting onto the map.
export function mapPathData(route) {
    const at = point => {
        const p = project(...point);
        return `${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
    };
    const parts = [`M${at(route[0])}`];
    for (let i = 1; i < route.length - 1; i++) {
        const a = route[i - 1], b = route[i], c = route[i + 1];
        const before = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const after = Math.hypot(c[0] - b[0], c[1] - b[1]);
        if (!before || !after) continue;
        const radius = Math.min(100, before / 2, after / 2);
        const enter = b.map((n, k) => n + (a[k] - n) * radius / before);
        const leave = b.map((n, k) => n + (c[k] - n) * radius / after);
        parts.push(`L${at(enter)}Q${at(b)} ${at(leave)}`);
    }
    parts.push(`L${at(route.at(-1))}`);
    return parts.join('');
}

export function mapRoadMarkup(road) {
    const y = project(0, road.centerY).y;
    const width = Math.abs(project(0, road.centerY + road.width).y - y);
    return `<path d="M0 ${y}H320" stroke="#d3d1ba" stroke-width="${width}"/><path d="M0 ${y}H320" stroke="#ede8d3" stroke-width="1.5" stroke-dasharray="8 9"/>`;
}
