import * as THREE from '../../../vendor/three/three.module.js';
import { TOWN_PLAZA, villagePathRoutes } from '../../data/townLandscapeLayout.js';
import { TOWN_BUS_ROAD } from '../../data/townBusRoad.js';

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

export function createSkyTexture() {
    const [image, ctx] = canvas(2048, 1024);
    const sky = ctx.createLinearGradient(0, 0, 0, 1024);
    sky.addColorStop(0, '#7dc9ed');
    sky.addColorStop(0.5, '#b1dff0');
    sky.addColorStop(1, '#e9f2dc');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 2048, 1024);
    const cloud = (x, y, scale) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#f9fcf4';
        ctx.beginPath();
        ctx.ellipse(0, 9, 94, 23, 0, 0, Math.PI * 2);
        ctx.ellipse(-40, 0, 35, 30, 0, 0, Math.PI * 2);
        ctx.ellipse(4, -13, 44, 37, 0, 0, Math.PI * 2);
        ctx.ellipse(50, 0, 34, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };
    cloud(270, 58, 1.05);
    cloud(1120, 73, 0.85);
    cloud(1750, 60, 1.1);
    cloud(690, 250, 0.8);
    return texture(image);
}

export function createPathsTexture() {
    const [image, ctx] = canvas(2048);
    ctx.scale(2048 / 3700, 2048 / 2600);
    ctx.lineCap = ctx.lineJoin = 'round';
    const routes = villagePathRoutes();
    const strokeRoutes = (color, width) => {
        ctx.strokeStyle = color;
        for (const [routeIndex, route] of routes.entries()) {
            ctx.lineWidth = width * (routeIndex === 0 ? 1.25 : 1);
            ctx.beginPath();
            ctx.moveTo(...route[0]);
            for (let index = 0; index < route.length - 1; index++) {
                const p0 = route[Math.max(0, index - 1)];
                const p1 = route[index];
                const p2 = route[index + 1];
                const p3 = route[Math.min(route.length - 1, index + 2)];
                ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6,
                    p1[1] + (p2[1] - p0[1]) / 6,
                    p2[0] - (p3[0] - p1[0]) / 6,
                    p2[1] - (p3[1] - p1[1]) / 6, ...p2);
            }
            ctx.stroke();
        }
    };
    strokeRoutes('#d1bc8b', 74);
    strokeRoutes('#e5ce98', 68);
    const { x: plazaX, y: plazaY, radiusX: rx, radiusY: ry } = TOWN_PLAZA;
    ctx.fillStyle = '#e5ce98';
    ctx.beginPath();
    ctx.moveTo(plazaX - rx, plazaY);
    ctx.bezierCurveTo(plazaX - rx * 1.08, plazaY - ry * 0.7,
        plazaX - rx * 0.4, plazaY - ry * 1.1, plazaX + rx * 0.1, plazaY - ry);
    ctx.bezierCurveTo(plazaX + rx * 0.75, plazaY - ry * 0.9,
        plazaX + rx * 1.1, plazaY - ry * 0.25, plazaX + rx, plazaY + ry * 0.3);
    ctx.bezierCurveTo(plazaX + rx * 0.85, plazaY + ry * 1.15,
        plazaX - rx * 0.15, plazaY + ry, plazaX - rx * 0.55, plazaY + ry * 0.85);
    ctx.bezierCurveTo(plazaX - rx * 0.95, plazaY + ry * 0.65,
        plazaX - rx, plazaY + ry * 0.25, plazaX - rx, plazaY);
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
    // Flat boarding pavement connects the footpath to the near-side curb.
    const roadEdge = TOWN_BUS_ROAD.centerY - TOWN_BUS_ROAD.width / 2;
    ctx.fillStyle = '#d7d5bf';
    ctx.beginPath();
    ctx.roundRect(TOWN_BUS_ROAD.stopX - TOWN_BUS_ROAD.platformWidth / 2,
        TOWN_BUS_ROAD.platformY, TOWN_BUS_ROAD.platformWidth,
        roadEdge - TOWN_BUS_ROAD.platformY, 8);
    ctx.fill();
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
