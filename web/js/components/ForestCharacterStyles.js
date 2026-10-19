import { EMPTY_CHARACTER_IMAGE } from '../data/characterAsset.js';
import { SALON_STYLES } from './salon/SalonStyleCatalog.js';
import { CHARACTER_HEIGHT } from '../data/characterScale.js';

// Keep saved style IDs and the shop's frame contract while artwork is removed.
export const FOREST_CHARACTER_STYLES = Object.freeze(SALON_STYLES.map(style => Object.freeze({
    id: style.id,
    label: style.label,
    preview: EMPTY_CHARACTER_IMAGE,
    frames: style.frames,
    scale: CHARACTER_HEIGHT / (['european-rabbit', 'red-fox'].includes(style.id) ? 340 : 330),
    portrait: true,
    ...(style.id === 'european-rabbit' ? { portraitCrop: [8, 40, 304, 340] } : {}),
    ...(style.id === 'red-fox' ? { portraitCrop: [8, 102, 304, 278] } : {})
})));
