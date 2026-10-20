import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { SOMANGI_MODELS, somangiAssetUrl } from '../js/data/somangiModels.js';
import { EMPTY_CHARACTER_IMAGE } from '../js/data/characterAsset.js';
import { CHARACTER_STYLES, characterSpriteSVG, characterFaceSVG, paintCharacterSprite } from '../js/components/CharacterSprite.js';

test('runtime source no longer requests deleted character files', () => {
    for (const directory of ['../js/', '../css/']) {
        const root = new URL(directory, import.meta.url);
        for (const file of readdirSync(root, { recursive: true })) {
            if (!/\.(js|css)$/.test(file)) continue;
            assert.doesNotMatch(readFileSync(new URL(file.replaceAll('\\', '/'), root), 'utf8'), /assets\/characters\/(?!(?:manager-park|dog-rgb-motion-v1|3d\/(?:somangi|agent-k))\/)/, file);
        }
    }
});

test('only the installed RGB dog is visible; other saved styles remain transparent', t => {
    const previousImage = globalThis.Image;
    let requests = 0;
    globalThis.Image = class {
        set src(value) {
            assert.ok(CHARACTER_STYLES.some(style => style.preview === value));
            requests++;
            this.naturalWidth = 1;
        }
    };
    t.after(() => { globalThis.Image = previousImage; });
    const ctx = { save() {}, translate() {}, scale() {}, drawImage() {}, restore() {} };
    for (const style of CHARACTER_STYLES) {
        if (style.id === 'dog') assert.match(style.preview, /dog-rgb-motion-v1\/atlas.png$/);
        else assert.equal(style.preview, EMPTY_CHARACTER_IMAGE);
        assert.ok(characterSpriteSVG({ styleId: style.id }).includes(style.preview));
        assert.ok(characterFaceSVG(style.id).includes(style.preview));
        paintCharacterSprite(ctx, 100, 100, { styleId: style.id });
    }
    assert.equal(requests, CHARACTER_STYLES.length);
});

test('every active Somangi motion resolves to a valid installed GLB', () => {
    for (const { file, clip } of Object.values(SOMANGI_MODELS)) {
        assert.ok(clip);
        const data = readFileSync(new URL(somangiAssetUrl(file)));
        assert.equal(data.toString('ascii', 0, 4), 'glTF', file);
        assert.equal(data.readUInt32LE(4), 2, file);
        assert.equal(data.readUInt32LE(8), data.length, file);
        const jsonLength = data.readUInt32LE(12);
        const scene = JSON.parse(data.toString('utf8', 20, 20 + jsonLength));
        assert.ok(scene.animations.some(animation => animation.name === clip), clip);
    }
});

test('Cipher fairy K has a valid installed 3D model', () => {
    const data = readFileSync(new URL('../assets/characters/3d/agent-k/Agent-K.glb', import.meta.url));
    assert.equal(data.toString('ascii', 0, 4), 'glTF');
    assert.equal(data.readUInt32LE(4), 2);
    assert.equal(data.readUInt32LE(8), data.length);
});
