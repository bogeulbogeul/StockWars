import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { TownPlayerController } from '../js/components/town/TownPlayerController.js';
import { TOWN_LANDSCAPE_BENCHES } from '../js/data/townLandscape.js';

test('bench recovery is shared across benches, saved per player, and resets at KST midnight', () => {
    let now = Date.parse('2026-09-29T23:59:00+09:00');
    const options = { market: { cash: 0, stocks: new Map() }, clock: () => now };
    const engine = new ItemEngine(options);
    engine.state.stamina = 0;
    assert.equal(engine.restOnBench().success, true);
    assert.equal(engine.state.stamina, 3);
    engine.state.stamina = 1;
    const restored = new ItemEngine({ ...options, state: JSON.parse(JSON.stringify(engine.state)) });
    let effects = 0;
    const player = new TownPlayerController({ onHeal: () => restored.restOnBench() });
    player.spawnHealEffect = () => effects++;
    for (const bench of TOWN_LANDSCAPE_BENCHES) {
        player.restOnBench(bench);
        assert.equal(player.isResting, true);
        assert.equal(player.renderPosition.x, bench.x + bench.width / 2);
        assert.ok(player.renderPosition.y < bench.y);
        assert.ok(player.renderPosition.z > bench.y);
        assert.equal(restored.state.stamina, 1);
        player.handleKeyDown({ key: 's' });
        assert.equal(player.isResting, false);
        assert.equal(player.renderPosition.y, player.charPosY);
        assert.ok(player.canStand(player.charPosX, player.charPosY));
    }
    assert.equal(effects, 0);
    assert.equal(new ItemEngine(options).restOnBench().success, true);
    now = Date.parse('2026-09-30T00:00:00+09:00');
    player.restOnBench(TOWN_LANDSCAPE_BENCHES[0]);
    assert.equal(restored.state.stamina, 3);
    assert.equal(effects, 1);
    player.restOnBench(TOWN_LANDSCAPE_BENCHES[0]);
    assert.equal(effects, 1);
});
