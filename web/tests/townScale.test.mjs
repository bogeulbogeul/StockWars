import test from 'node:test';
import assert from 'node:assert/strict';
import { TOWN_BUILDINGS } from '../js/data/townWorldData.js';
import { TOWN_LANDSCAPE, TOWN_LANDSCAPE_INTERACTIVE } from '../js/data/townLandscape.js';
import { TOWN_CHARACTER_HEIGHT } from '../js/data/townScale.js';
import { townEntrance } from '../js/data/townLayout.js';
import { TownPlayerController } from '../js/components/town/TownPlayerController.js';

test('H90 layout keeps every visible interaction accessible from the plaza', () => {
    assert.equal(TOWN_CHARACTER_HEIGHT, 90);
    const player = new TownPlayerController(), step = 20;
    const queue = [[1800, 1100]], seen = new Set(['1800,1100']);
    for (let i = 0; i < queue.length; i++) {
        const [x,y] = queue[i];
        for (const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]) {
            const nx=x+dx, ny=y+dy, key=`${nx},${ny}`;
            if (!seen.has(key) && player.canStand(nx,ny) && player.canStand(x+dx/2,y+dy/2)) {
                seen.add(key); queue.push([nx,ny]);
            }
        }
    }
    for (const object of [...TOWN_BUILDINGS, ...TOWN_LANDSCAPE_INTERACTIVE]) {
        const entry = townEntrance(object);
        assert.ok(player.canStand(entry.x, entry.y), object.id);
        assert.ok(queue.some(([x,y]) => Math.hypot(x-entry.x,y-entry.y)<25), object.id);
    }
});

test('resized artwork preserves aspect ratio and remains inside world bounds', () => {
    for (const p of TOWN_LANDSCAPE) {
        assert.ok(p.x >= 60 && p.x+p.width <= 3640, p.id);
        assert.ok(p.y-p.height >= 100 && p.y <= 2500, p.id);
        const [, , w, h] = p.viewBox.split(' ').map(Number);
        assert.ok(Math.abs(p.width/p.height-w/h)<1e-8, p.id);
    }
    const vending = TOWN_LANDSCAPE.find(p=>p.type==='vending');
    assert.ok(vending.height>TOWN_CHARACTER_HEIGHT && vending.height<TOWN_CHARACTER_HEIGHT*1.5);
    for (const bench of TOWN_LANDSCAPE.filter(p=>p.type==='bench')) {
        assert.ok(bench.height<TOWN_CHARACTER_HEIGHT);
    }
});
