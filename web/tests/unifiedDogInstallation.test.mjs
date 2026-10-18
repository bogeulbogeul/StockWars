import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveCharacterStyle, characterFrame, characterFaceSVG, characterSpriteSVG, paintCharacterSprite } from '../js/components/CharacterSprite.js';
import { characterGeometry, characterCargoPlacement } from '../js/components/CharacterSpriteGeometry.js';

const dog = resolveCharacterStyle('dog');
const installed = new URL('../assets/characters/dog-rgb-motion-v1/', import.meta.url);
const source = new URL('../../output/dog-rgb-motion-v1/', import.meta.url);

test('installed RGB dog artwork and metadata match the selected source', () => {
    assert.deepEqual(readFileSync(new URL('atlas.png', installed)), readFileSync(new URL('sprite-sheet-alpha.png', source)));
    const installedManifest = JSON.parse(readFileSync(new URL('manifest.json', installed)));
    const sourceManifest = JSON.parse(readFileSync(new URL('manifest.json', source)));
    assert.deepEqual(installedManifest.frame_layout, sourceManifest.frame_layout);
    assert.deepEqual(installedManifest.animation, sourceManifest.animation);
    assert.equal(installedManifest.game_input, 'atlas.png');
    assert.equal(installedManifest.sprite_sheet_alpha, 'atlas.png');
    assert.equal(dog.preview, new URL('atlas.png', installed).href);
    const manifest = JSON.parse(readFileSync(new URL('manifest.json', source)));
    assert.deepEqual(dog.frames, manifest.frame_layout);
    assert.equal(dog.frames.cellWidth, 512);
    for (const direction of ['down', 'right', 'up']) {
        const cycle = [0, 160, 320, 480].map(time => characterFrame({ styleId: 'dog', direction, moving: true, time }).rect);
        assert.deepEqual(cycle[1], cycle[3]);
        assert.notDeepEqual(cycle[0], cycle[2]);
        assert.deepEqual(manifest.animation.rows[`${direction}_walk`].durations_ms, [160, 160, 160, 160]);
    }
});

test('all ten states stay within the installed atlas, and UI portraits use its face row', () => {
    assert.equal(Object.keys(dog.frames.rows).length, 10);
    for (const row of Object.values(dog.frames.rows)) for (const rect of row) {
        assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= 2048 && rect.y + rect.h <= 5120);
    }
    assert.match(characterFaceSVG('dog'), /viewBox="16 4672 480 384"/);
    assert.ok(characterFaceSVG('dog').includes(dog.preview));
    assert.match(characterSpriteSVG({ styleId: 'dog', direction: 'right', seated: true }), /viewBox="0 4096 512 512"/);
});

test('Canvas and SVG share the new foot origin; cargo is anchored above the feet', t => {
    const oldImage = globalThis.Image;
    globalThis.Image = class { naturalWidth = 2048; set src(value) { assert.equal(value, dog.preview); } };
    t.after(() => { globalThis.Image = oldImage; });
    const calls = [];
    const ctx = { save() {}, restore() {}, scale() {}, translate(...args) { calls.push(args); }, drawImage(...args) { calls.push(args.slice(-4)); } };
    paintCharacterSprite(ctx, 10, 20, { styleId: 'dog', carrying: true, moving: true, time: 480 });
    assert.deepEqual(calls, [[10, 20], [-256, -488], [0, 0, 512, 512]]);
    assert.equal(characterGeometry(dog).anchorY, 488);
    const cargo = characterCargoPlacement(dog);
    assert.ok(cargo.left > 0 && cargo.bottom > 0 && cargo.bottom < 90);
});
