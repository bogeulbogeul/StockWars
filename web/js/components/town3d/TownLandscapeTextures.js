import * as THREE from '../../../vendor/three/three.module.js';
import { TOWN_PLAZA, villagePathRoutes } from '../../data/townLandscapeLayout.js';

function canvas(width, height = width) {
    const image = document.createElement('canvas');
    image.width = width;
    image.height = height;
    return [image, image.getContext('2d')];
}

function texture(image) {
    const map = new THREE.CanvasTexture(image);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
}

export function createGrassTexture() {
    const [image, ctx] = canvas(512);
    ctx.fillStyle = '#91bd66';
    ctx.fillRect(0, 0, 512, 512);
    let seed = 1827;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    // Sparse, low-contrast triangular blades read as a clean illustrated lawn.
    for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 16; col++) {
            const x = col * 32 + random() * 20;
            const y = row * 32 + random() * 20;
            const size = 3 + random() * 4;
            ctx.fillStyle = ['#86b45e', '#a2c978', '#94bf68'][Math.floor(random() * 3)];
            ctx.beginPath();
            ctx.moveTo(x, y + size);
            ctx.lineTo(x + size * 0.65, y - size);
            ctx.lineTo(x + size * 1.3, y + size);
            ctx.fill();
        }
    }
    const map = texture(image);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(65, 65);
    return map;
}

export function createPathsTexture() {
    const [image, ctx] = canvas(2048);
    ctx.scale(2048 / 3700, 2048 / 2600);
    ctx.lineCap = ctx.lineJoin = 'round';
    const routes = villagePathRoutes();
    const strokeRoutes = (color, width) => {
        ctx.strokeStyle = color;
        for (const [routeIndex, route] of routes.entries()) {
            ctx.lineWidth = width * (routeIndex === 0 ? 1.15 : routeIndex === 2 ? 1 : .76);
            ctx.beginPath();
            ctx.moveTo(...route[0]);
            for (let index = 1; index < route.length - 1; index++) {
                const previous = route[index - 1], corner = route[index], next = route[index + 1];
                const before = Math.hypot(corner[0] - previous[0], corner[1] - previous[1]);
                const after = Math.hypot(next[0] - corner[0], next[1] - corner[1]);
                if (!before || !after) continue;
                const radius = Math.min(100, before / 2, after / 2);
                ctx.lineTo(corner[0] + (previous[0] - corner[0]) * radius / before,
                    corner[1] + (previous[1] - corner[1]) * radius / before);
                ctx.quadraticCurveTo(...corner,
                    corner[0] + (next[0] - corner[0]) * radius / after,
                    corner[1] + (next[1] - corner[1]) * radius / after);
            }
            ctx.lineTo(...route[route.length - 1]);
            ctx.stroke();
        }
    };
    strokeRoutes('#d1bc8b', 58);
    strokeRoutes('#e5ce98', 54);
    const { x: plazaX, y: plazaY, radiusX: rx, radiusY: ry } = TOWN_PLAZA;
    ctx.fillStyle = '#e5ce98';
    ctx.beginPath();
    ctx.ellipse(plazaX, plazaY, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // A few small grains keep paths soft without a noisy dirt overlay.
    ctx.fillStyle = '#d6bd87';
    for (let i = 0; i < 170; i++) {
        const angle = i * 2.39996;
        const radius = Math.sqrt((i + 1) / 170);
        const x = plazaX + Math.cos(angle) * radius * rx * 0.85;
        const y = plazaY + Math.sin(angle) * radius * ry * 0.85;
        ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    return texture(image);
}

export function createContactShadowTexture() {
    const [image, ctx] = canvas(128);
    const shadow = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    shadow.addColorStop(0, 'rgba(35,57,32,0.28)');
    shadow.addColorStop(0.5, 'rgba(35,57,32,0.16)');
    shadow.addColorStop(1, 'rgba(35,57,32,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, 128, 128);
    return texture(image);
}
