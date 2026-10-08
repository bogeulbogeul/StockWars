// Points are ordered by time/x. Prefer the newest sample when several records
// occupy the same screen pixel, including the current quote at the right edge.
export function nearestChartPoint(points, x, tolerance = 0) {
    if (!points.length) return null;
    if (x <= points[0].x + Math.max(0, tolerance)) return points[0];
    if (x >= points.at(-1).x) return points.at(-1);
    let low = 0, high = points.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (points[mid].x < x) low = mid + 1;
        else high = mid;
    }
    const before = points[Math.max(0, low - 1)];
    const after = points[Math.min(low, points.length - 1)];
    const distance = Math.min(Math.abs(x - before.x), Math.abs(x - after.x));
    const rightEdge = x + distance + Math.max(0, tolerance);
    low = 0;
    high = points.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (points[mid].x <= rightEdge) low = mid + 1;
        else high = mid;
    }
    return points[Math.max(0, low - 1)];
}

let rectIncludesZoom;
// Chromium 120 (Electron 28) reports client rects before CSS zoom, while
// pointer clientX/clientY already use viewport pixels. New Chromium includes zoom.
export function chartViewportRect(element) {
    if (rectIncludesZoom === undefined) {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;visibility:hidden;width:10px;height:10px;pointer-events:none';
        const child = document.createElement('div');
        child.style.cssText = 'width:10px;height:10px;zoom:2';
        probe.append(child);
        document.body.append(probe);
        rectIncludesZoom = child.getBoundingClientRect().width / probe.getBoundingClientRect().width > 1.5;
        probe.remove();
    }
    const rect = element.getBoundingClientRect();
    if (rectIncludesZoom) return rect;
    let zoom = 1;
    for (let node = element; node; node = node.parentElement) {
        zoom *= parseFloat(getComputedStyle(node).zoom) || 1;
    }
    return { left: rect.left * zoom, right: rect.right * zoom,
        top: rect.top * zoom, bottom: rect.bottom * zoom,
        width: rect.width * zoom, height: rect.height * zoom };
}
