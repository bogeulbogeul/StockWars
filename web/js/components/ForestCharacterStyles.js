import { SALON_STYLES } from './salon/SalonStyleCatalog.js';
import { CHARACTER_HEIGHT } from '../data/characterScale.js';

// Share the shop's state/rectangle contract with the player renderer. The
// approved PNGs are copied without recoloring or regenerating their pixels.
export const FOREST_CHARACTER_STYLES = Object.freeze(SALON_STYLES.map(style => Object.freeze({
    id: style.id,
    label: style.label,
    preview: new URL(`../../assets/characters/forest-friends/${style.id}/atlas.png`, import.meta.url).href,
    frames: style.frames,
    scale: CHARACTER_HEIGHT / 330,
    portrait: true
})));
