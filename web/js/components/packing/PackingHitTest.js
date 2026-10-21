// The displayed product rectangle is independent of image loading and alpha.
// Exclude SVG letterboxing, labels and card padding from drag initiation.
// Compatibility for pages still holding an earlier controller module.
export function preloadHitMasks() {}

export function hitsArtwork(button, clientX, clientY) {
    const svg = button.querySelector('.packing-art');
    if (!svg) return false;
    const rect = svg.getBoundingClientRect();
    const box = svg.viewBox.baseVal;
    if (!box.width || !box.height || !rect.width || !rect.height) return false;
    const scale = Math.min(rect.width / box.width, rect.height / box.height);
    const width = box.width * scale, height = box.height * scale;
    const left = rect.left + (rect.width - width) / 2;
    const top = rect.top + (rect.height - height) / 2;
    const padding = 6;
    return clientX >= Math.max(rect.left, left - padding)
        && clientX <= Math.min(rect.right, left + width + padding)
        && clientY >= Math.max(rect.top, top - padding)
        && clientY <= Math.min(rect.bottom, top + height + padding);
}
