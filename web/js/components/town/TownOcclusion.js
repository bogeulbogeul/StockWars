import { TOWN_BUILDINGS } from '../../data/townWorldData.js';
import { TOWN_LANDSCAPE } from '../../data/townLandscape.js';

export const TOWN_OCCLUDERS = [
    ...TOWN_BUILDINGS.map(b => ({ elementId: `building_${b.id}`, x: b.x + (b.width - b.asset.displayWidth) / 2,
        y: b.y, width: b.asset.displayWidth, height: b.height, margin: 24 })),
    ...TOWN_LANDSCAPE.map(p => ({ elementId: `landscape_${p.id}`, ...p, margin: 16 }))
];

export function isBehindObject(player, object) {
    return player.y < object.y && player.y > object.y - object.height &&
        player.x > object.x - object.margin && player.x < object.x + object.width + object.margin;
}

// Fading belongs only to this client's controlled character. Remote characters must
// remain concealed even when the local character fades the same foreground object.
export function getTownVisibility(localPlayer, remotePlayers, occluders = TOWN_OCCLUDERS) {
    return {
        fadedObjects: new Set(occluders.filter(o => isBehindObject(localPlayer, o)).map(o => o.elementId)),
        hiddenPlayers: new Set(remotePlayers.filter(p => occluders.some(o => isBehindObject(p, o))).map(p => p.id))
    };
}
