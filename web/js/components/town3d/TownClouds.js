import * as THREE from '../../../vendor/three/three.module.js';

// Sparse, softly rounded clouds. Positions and speeds are fractions of the sky.
const CLOUDS = [
    { x: .12, y: .047, width: .145, speed: .0038 },
    { x: .56, y: .102, width: .11, speed: .0027 },
    { x: .86, y: .035, width: .125, speed: .0033 },
    { x: .32, y: .175, width: .09, speed: .0021 }
];

export function townCloudPositions(seconds, reducedMotion = false) {
    const time = reducedMotion ? 0 : seconds;
    return CLOUDS.map(cloud => ({ ...cloud,
        x: ((cloud.x + time * cloud.speed + cloud.width) % (1 + cloud.width * 2)) - cloud.width
    }));
}

export function drawTownClouds(ctx, width, height, seconds, skyColors, reducedMotion) {
    // Using the current blended sky colors also makes cloud tint transitions smooth.
    const horizon = new THREE.Color(skyColors[2]);
    const top = horizon.clone().lerp(new THREE.Color('#fffaf0'), .65);
    const base = horizon.clone().lerp(new THREE.Color(skyColors[1]), .3);
    for (const cloud of townCloudPositions(seconds, reducedMotion)) {
        const x = cloud.x * width, y = cloud.y * height;
        const w = cloud.width * width, h = w * .3;
        ctx.save();
        ctx.translate(x, y);
        const fill = ctx.createLinearGradient(0, -h, 0, h * .35);
        fill.addColorStop(0, `#${top.getHexString()}`);
        fill.addColorStop(1, `#${base.getHexString()}`);
        ctx.fillStyle = fill;
        ctx.globalAlpha = .78;
        ctx.beginPath();
        ctx.moveTo(-w * .44, h * .24);
        ctx.bezierCurveTo(-w * .66, h * .12, -w * .58, -h * .35, -w * .32, -h * .32);
        ctx.bezierCurveTo(-w * .3, -h * .91, w * .04, -h, w * .14, -h * .48);
        ctx.bezierCurveTo(w * .3, -h * .69, w * .45, -h * .34, w * .44, -h * .12);
        ctx.bezierCurveTo(w * .67, -h * .08, w * .65, h * .27, w * .39, h * .28);
        ctx.bezierCurveTo(w * .13, h * .35, -w * .22, h * .35, -w * .44, h * .24);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
