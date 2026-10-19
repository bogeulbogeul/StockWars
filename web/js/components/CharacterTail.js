import { EMPTY_CHARACTER_IMAGE } from '../data/characterAsset.js';
const TAILS = {
    dog: { src: EMPTY_CHARACTER_IMAGE, crop: [355, 293, 533, 569], width: 46, imageWidth: 1312, imageHeight: 1199 },
    'black-cat': { src: EMPTY_CHARACTER_IMAGE, crop: [203, 179, 864, 898], width: 78, imageWidth: 1226, imageHeight: 1283 }
};
const images = new Map();
export function tailPose(styleId, state, index = 0, moving = false) {
    const asset = TAILS[styleId] || TAILS.dog;
    const rear = state.startsWith('up_'), front = state.startsWith('down_'), seated = state.endsWith('_sit');
    const width = rear ? asset.width * .85 : asset.width;
    const height = width * asset.crop[3] / asset.crop[2];
    return { ...asset, width, height, x: rear ? 132 : front ? 111 : seated ? 105 : 103,
        y: seated ? 242 : rear ? 231 : 227,
        angle: (rear ? 0 : seated ? -28 : -35) + (moving && !seated ? [-7, 0, 7, 0][index % 4] : 0),
        foreground: rear, offsetX: -width * .93, offsetY: -height * .92 };
}
export function tailSVG(p) {
    return `<g data-character-tail="true" transform="translate(${p.x} ${p.y}) rotate(${p.angle})"><svg x="${p.offsetX}" y="${p.offsetY}" width="${p.width}" height="${p.height}" viewBox="${p.crop.join(' ')}" overflow="hidden"><image href="${p.src}" width="${p.imageWidth}" height="${p.imageHeight}"/></svg></g>`;
}
export function paintTail(ctx, p) {
    if (!images.has(p.src)) { const image = new Image(); image.src = p.src; images.set(p.src, image); }
    const image = images.get(p.src);
    if (!image.naturalWidth) return;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle * Math.PI / 180);
    ctx.drawImage(image, ...p.crop, p.offsetX, p.offsetY, p.width, p.height); ctx.restore();
}
