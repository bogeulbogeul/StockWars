import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_CHARACTER_IMAGE } from '../js/data/characterAsset.js';
import { CHARACTER_STYLES, BASE_CHARACTER_STYLES, characterFrame, characterFaceSVG,
    characterSpriteSVG, setPlayerCharacterStyle } from '../js/components/CharacterSprite.js';
import { SALON_STYLES } from '../js/components/salon/SalonStyleCatalog.js';

test('forest styles retain saved IDs and frame contracts without installed artwork', () => {
    assert.deepEqual(BASE_CHARACTER_STYLES.map(s => s.id), ['dog', 'black-cat']);
    assert.equal(CHARACTER_STYLES.length, 8);
    for (const sale of SALON_STYLES) {
        const style = CHARACTER_STYLES.find(s => s.id === sale.id);
        assert.equal(style.preview, EMPTY_CHARACTER_IMAGE);
        assert.deepEqual(style.frames, sale.frames);
        if (sale.id === 'european-rabbit') {
            assert.equal(style.scale, 90 / 340);
            assert.deepEqual(style.portraitCrop, [8, 40, 304, 340]);
        }
        if (sale.id === 'red-fox') {
            assert.equal(style.scale, 90 / 340);
            assert.deepEqual(style.portraitCrop, [8, 102, 304, 278]);
        }
    }
});

test('saved forest styles reach world rendering, portraits and all supported motion states', () => {
    try {
        for (const sale of SALON_STYLES) {
            setPlayerCharacterStyle(sale.id);
            assert.ok(characterSpriteSVG().includes(EMPTY_CHARACTER_IMAGE));
            const portrait = characterFaceSVG(sale.id);
            assert.match(portrait, /viewBox="0 3600 320 400"/);
            for (const direction of ['down', 'right', 'up', 'left']) {
                const neutral = characterFrame({ direction, time: 160, moving: true });
                assert.deepEqual(characterFrame({ direction, time: 0 }).rect, neutral.rect);
                assert.deepEqual([0,160,320,480].map(time => characterFrame({ direction, moving: true, time }).index), [0,1,2,1]);
                assert.deepEqual([0,160,320,480].map(time => characterFrame({ direction, carrying: true, moving: true, time }).rect), sale.frames.rows.right_carry);
                const sit = characterFrame({ direction, seated: true });
                assert.deepEqual(sit.rect, sale.frames.rows[direction === 'left' || direction === 'right' ? 'right_sit' : 'down_sit'][0]);
            }
        }
    } finally { setPlayerCharacterStyle('dog'); }
});
