import { CanvasTexture, Group, Sprite, SpriteMaterial, SRGBColorSpace } from '../../../vendor/three/three.module.js';

let glyph;
function sleepGlyph() {
    if (glyph) return glyph;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 92px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 9;
    ctx.strokeStyle = '#48665e'; ctx.fillStyle = '#fff8df';
    ctx.strokeText('z', 64, 65); ctx.fillText('z', 64, 65);
    glyph = new CanvasTexture(canvas); glyph.colorSpace = SRGBColorSpace;
    return glyph;
}

// Camera-facing text remains legible beside the head under the shelter roof.
export function createSleepEffect(root) {
    const group = new Group(); group.name = 'moa-sleep-zzzz'; root.add(group);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sprites = Array.from({ length: 4 }, () => {
        const sprite = new Sprite(new SpriteMaterial({ map: sleepGlyph(), transparent: true,
            depthTest: false, depthWrite: false, toneMapped: false }));
        sprite.renderOrder = 20; group.add(sprite); return sprite;
    });
    let time = 0;
    return {
        setSleeping(sleeping) { group.visible = sleeping; },
        update(dt) {
            if (!group.visible) return;
            time += Math.min(Math.max(dt || 0, 0), .1);
            sprites.forEach((sprite, index) => {
                const phase = reduced ? index / 4 : (time / 3.6 + index / 4) % 1;
                sprite.position.set(29 + phase * 24, 83 + phase * 40, 24);
                const size = 12 + phase * 10;
                sprite.scale.setScalar(size);
                sprite.material.opacity = reduced ? .85 : Math.min(1, phase * 7, (1 - phase) * 5);
            });
        }
    };
}
