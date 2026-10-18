import { DOG_FRAMES } from './DogSpriteData.js';
import { CHARACTER_HEIGHT } from '../data/characterScale.js';

export const DOG_UNIFIED_STYLE = Object.freeze({
    id: 'dog', label: '시고르자브종',
    preview: new URL('../../assets/characters/dog-rgb-motion-v1/atlas.png', import.meta.url).href,
    frames: DOG_FRAMES,
    // Crown at y39, planted foot at y488; ears and transparent padding excluded.
    scale: CHARACTER_HEIGHT / 449,
    geometry: Object.freeze({ width: 512, height: 512, anchorX: 256, anchorY: 488, carryX: 356, carryY: 291 }),
    portrait: true, portraitCrop: [16, 64, 480, 384]
});
