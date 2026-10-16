import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARACTER_STYLES, BASE_CHARACTER_STYLES, characterFrame, characterFaceSVG,
    characterSpriteSVG, setPlayerCharacterStyle } from '../js/components/CharacterSprite.js';
import { SALON_STYLES } from '../js/components/salon/SalonStyleCatalog.js';

test('forest shop and player use the same installed approved sheets and frame rectangles', () => {
    assert.deepEqual(BASE_CHARACTER_STYLES.map(s => s.id), ['dog', 'black-cat']);
    assert.equal(CHARACTER_STYLES.length, 8);
    for (const sale of SALON_STYLES) {
        const style = CHARACTER_STYLES.find(s => s.id === sale.id);
        const asset = new URL(style.preview);
        const manifest = JSON.parse(readFileSync(new URL('manifest.json', asset)));
        assert.deepEqual(style.frames, manifest.frame_layout);
        assert.deepEqual(style.frames, sale.frames);
        const source = new URL(`../../output/style-unification-v3/${sale.id}/run/sprite-sheet-alpha.png`, import.meta.url);
        assert.deepEqual(readFileSync(asset), readFileSync(source));
        if (sale.id === 'european-rabbit') {
            assert.deepEqual(readFileSync(asset), readFileSync(new URL('../../output/rabbit-rear-locked-v1/run/sprite-sheet-alpha.png', import.meta.url)));
        }
    }
});

test('saved forest styles reach world rendering, portraits and all supported motion states', () => {
    try {
        for (const sale of SALON_STYLES) {
            setPlayerCharacterStyle(sale.id);
            assert.match(characterSpriteSVG(), new RegExp(`forest-friends/${sale.id}/atlas.png`));
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
