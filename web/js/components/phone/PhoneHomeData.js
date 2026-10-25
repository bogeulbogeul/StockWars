// Flat pictograms share a 48-unit canvas; no raster mockup or Blender asset is used.
export const PHONE_APPS = [
    ['stock', '주식', 'sage'], ['news', '소식', 'blue'],
    ['achievements', '업적', 'yellow'], ['messenger', '메신저', 'peach'],
    ['tasks', '할 일', 'sage'], ['profile', '내 정보', 'yellow'],
    ['map', '지도', 'sage'], ['settings', '설정', 'blue']
];
const shapes = {
    stock: '<path d="M7 28 19 17l8 6L41 8M31 8h10v10" fill="none" stroke="currentColor" stroke-width="4"/><rect x="7" y="34" width="7" height="8" rx="2"/><rect x="20" y="29" width="7" height="13" rx="2"/><rect x="33" y="23" width="7" height="19" rx="2"/>',
    news: '<rect x="8" y="5" width="33" height="38" rx="3"/><rect x="13" y="11" width="11" height="11" rx="1" fill="#86a5b9"/><path d="M29 12h6m-6 6h6M14 28h21M14 34h21M14 39h16" stroke="#9b9c91" stroke-width="2.5"/>',
    achievements: '<path d="m12 5 5 18h14l5-18H26l-2 9-2-9Z" fill="#c76c60"/><path d="m16 5 6 17h4L22 5"/><circle cx="24" cy="30" r="14" fill="#e4aa39"/><path d="m24 19 3.3 6.6 7.3 1.1-5.3 5.1 1.3 7.3-6.6-3.5-6.6 3.5 1.3-7.3-5.3-5.1 7.3-1.1Z"/>',
    messenger: '<path d="M24 6C12 6 5 12 5 21c0 5 3 9 7 12l-2 7 10-5h4c11 0 18-6 18-14S35 6 24 6Z"/><path d="M32 23c-8 0-13 4-13 10s6 10 13 10h3l7 3-1-6c3-2 4-4 4-7 0-6-5-10-13-10Z" fill="#efb5a5"/>',
    tasks: '<rect x="8" y="5" width="33" height="38" rx="3"/><g stroke="#87a27e" stroke-width="3" fill="none"><path d="m13 15 3 3 5-6m-8 14 3 3 5-6m-8 14 3 3 5-6M27 15h8m-8 11h8m-8 11h8"/></g>',
    profile: '<circle cx="24" cy="15" r="10"/><path d="M7 42v-4a17 17 0 0 1 34 0v4Z"/>',
    map: '<path d="m4 12 13-5 14 5 13-5v30l-13 5-14-5-13 5Z"/><path d="m17 7 14 5v30l-14-5Z" fill="#cad6ad"/><path d="M34 4a10 10 0 0 0-10 10c0 7 10 18 10 18s10-11 10-18A10 10 0 0 0 34 4Z" fill="#d66d5a"/><circle cx="34" cy="14" r="4" fill="#f6e9ce"/>',
    settings: '<path d="m20 3-1 6-5 2-5-3-5 7 4 4-1 5-5 2 2 8 6-1 4 4v6h9l2-6 5-2 5 3 5-7-4-5 1-5 5-2-2-8-6 1-4-4V3Z"/><circle cx="24" cy="23" r="8" fill="#86a5b9"/>',
    sun: '<circle cx="24" cy="24" r="10"/><path d="M24 3v5m0 32v5M3 24h5m32 0h5M9 9l4 4m22 22 4 4M9 39l4-4m22-22 4-4" fill="none" stroke="currentColor" stroke-width="3"/>',
    cloud: '<path d="M12 36a10 10 0 0 1-1-20 13 13 0 0 1 25-1 11 11 0 0 1 0 22H12Z"/>',
    rain: '<path d="M10 29a9 9 0 0 1 0-18 12 12 0 0 1 23-1 10 10 0 0 1 2 19Z"/><path d="m14 34-3 7m14-7-3 7m14-7-3 7" stroke="currentColor" stroke-width="3"/>',
    snow: '<path d="M24 4v40M7 14l34 20M7 34l34-20M18 8l6 6 6-6M18 40l6-6 6 6" fill="none" stroke="currentColor" stroke-width="3"/>'
};
export function phoneIcon(id) {
    return `<svg viewBox="0 0 48 48" aria-hidden="true" fill="currentColor" stroke-linecap="round" stroke-linejoin="round">${shapes[id] || shapes.sun}</svg>`;
}
