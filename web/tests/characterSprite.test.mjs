import test from 'node:test';
import assert from 'node:assert/strict';
import { characterFrame, characterSpriteSVG, updateCharacterSprite, setPlayerCharacterStyle, resolveCharacterStyle } from '../js/components/CharacterSprite.js';
import { CharacterCreation } from '../js/components/CharacterCreation.js';

test('selection reaches saved profile and selects cat atlas; older profiles use dog', () => {
    let profile;
    CharacterCreation.prototype.finishCreation.call({ nickname: '테스트', styleId: 'black-cat', chosenTrait: {}, close() {}, callbacks: { onComplete(p) { profile = p; } } });
    setPlayerCharacterStyle(profile.styleId);
    assert.match(characterSpriteSVG(), /black-cat-npc-v2\/atlas.png/);
    setPlayerCharacterStyle(undefined);
    assert.match(characterSpriteSVG(), /dog-npc-v2\/atlas.png/);
    assert.equal(resolveCharacterStyle('unknown').id, 'dog');
});
test('cat source rows, mirror and common H90 scale work for all motion states', () => {
    for (const options of [{ moving: true }, { moving: true, carrying: true }, { seated: true }]) {
        const right = characterFrame({ ...options, styleId: 'black-cat', direction: 'right', time: 320 });
        const left = characterFrame({ ...options, styleId: 'black-cat', direction: 'left', time: 320 });
        assert.deepEqual(left.rect, right.rect);
        assert.equal(left.flip, true);
        assert.equal(left.style.scale * 307, 90);
    }
    assert.equal(characterFrame({ styleId: 'black-cat', direction: 'back', moving: true }).rect.y, 2000);
});
test('switching style refreshes DOM even at same direction and frame', () => {
    const host = { dataset: {}, style: {}, innerHTML: '' };
    updateCharacterSprite(host, { styleId: 'dog', direction: 'front' });
    const dog = host.innerHTML;
    updateCharacterSprite(host, { styleId: 'black-cat', direction: 'front' });
    assert.notEqual(host.innerHTML, dog);
    assert.match(host.innerHTML, /검은 고양이/);
});

test('both atlases preserve manifest bounds, three-pose loops and four carry poses', async () => {
    const { readFileSync } = await import('node:fs');
    for (const styleId of ['dog', 'black-cat']) {
        const style = resolveCharacterStyle(styleId);
        const png = readFileSync(new URL(style.preview));
        assert.equal(png.readUInt32BE(16), style.frames.sheetWidth);
        assert.equal(png.readUInt32BE(20), style.frames.sheetHeight);
        assert.equal(png[25], 6);
        for (const row of Object.values(style.frames.rows)) for (const f of row) {
            assert.ok(f.x + f.w <= style.frames.sheetWidth && f.y + f.h <= style.frames.sheetHeight);
        }
        for (const direction of ['down', 'right', 'up']) {
            assert.deepEqual([0,160,320,480].map(time => characterFrame({styleId,direction,moving:true,time}).index), [0,1,2,1]);
        }
        assert.deepEqual([0,160,320,480].map(time => characterFrame({styleId,direction:'right',moving:true,carrying:true,time}).index), [0,1,2,3]);
        assert.equal(characterFrame({styleId,direction:'right',carrying:true,time:320}).index, 0);
    }
});
