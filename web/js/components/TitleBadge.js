import { PLAYER_TITLES, titleName } from '../data/playerTitles.js';

// Text stays in the DOM so translations never require new artwork.
export function createTitleBadge(id, locale) {
    const title = PLAYER_TITLES[id];
    if (!title) return null;
    const badge = document.createElement('span');
    badge.className = 'player-title-badge';
    badge.dataset.titleId = id;
    const image = document.createElement('img');
    image.src = new URL(`../../assets/titles/${title.image}`, import.meta.url).href;
    image.alt = '';
    image.draggable = false;
    const label = document.createElement('span');
    label.textContent = titleName(id, locale);
    badge.append(image, label);
    return badge;
}
