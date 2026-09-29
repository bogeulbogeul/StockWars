import test from 'node:test';
import assert from 'node:assert/strict';
import { TOWN_OCCLUDERS, getTownVisibility } from '../js/components/town/TownOcclusion.js';

for (const id of ['building_home_office_tower', 'landscape_west_tree_1']) {
    test(`${id}: local fading never exposes a remote avatar`, () => {
        const object = TOWN_OCCLUDERS.find(o => o.elementId === id);
        const behind = { x: object.x + object.width / 2, y: object.y - object.height / 2 };
        const front = { x: behind.x, y: object.y + 45 };
        const together = getTownVisibility(behind, [{ ...behind, id: 'other' }], [object]);
        assert.ok(together.fadedObjects.has(id));
        assert.ok(together.hiddenPlayers.has('other'));
        const onlyRemote = getTownVisibility(front, [{ ...behind, id: 'other' }], [object]);
        assert.equal(onlyRemote.fadedObjects.size, 0);
        assert.ok(onlyRemote.hiddenPlayers.has('other'));
        const emerging = getTownVisibility(behind, [{ ...front, id: 'other' }], [object]);
        assert.equal(emerging.hiddenPlayers.size, 0);
        assert.ok(emerging.fadedObjects.has(id));
        const secondViewer = getTownVisibility(front, [{ ...behind, id: 'first-viewer' }], [object]);
        assert.equal(secondViewer.fadedObjects.size, 0);
        assert.ok(secondViewer.hiddenPlayers.has('first-viewer'));
    });
}
