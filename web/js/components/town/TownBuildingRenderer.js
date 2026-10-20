import { TOWN_BUILDINGS } from '../../data/townWorldData.js';

// DOM markers retain click/entrance contracts. All village artwork uses 3D models.
export class TownBuildingRenderer {
    static renderBuildingsHTML() {
        return TOWN_BUILDINGS.map(b => `
            <div class="town-building-box building-with-asset ${b.isMainLandmark ? 'landmark-main' : ''}"
                 id="building_${b.id}"
                 data-building-id="${b.id}"
                 data-building-name="${b.name}"
                 data-building-desc="${b.desc}"
                 data-action-text="${b.actionText}"
                 aria-label="${b.name}${b.available === false ? ' · 오픈 준비중' : ''}"
                 style="left: ${b.x}px; width: ${b.width}px; height: ${b.height}px; top: ${b.y - b.height}px; z-index: ${b.y};">
            </div>
        `).join('');
    }

    // Retain stage contracts without reviving retired 2D props.
    static renderInteractivePropsHTML() { return ''; }
    static renderStreetPropsHTML() { return ''; }
}
