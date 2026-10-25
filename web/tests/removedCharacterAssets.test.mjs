import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { moaAssetUrl, MOA_LEAF_MOODS } from '../js/data/moaModels.js';
import { SOMANGI_MODELS, SOMANGI_EXPRESSIONS, somangiAssetUrl } from '../js/data/somangiModels.js';
import * as THREE from '../vendor/three/three.module.js';
import { SomangiPlayer } from '../js/components/town3d/SomangiPlayer.js';
import { addCipherAgentK } from '../js/components/cipher3d/CipherAgentK.js';
import { addVivianShopkeeper } from '../js/components/store3d/VivianShopkeeper.js';
import { GROUND_PROJECTION } from '../js/data/townModelBuildings.js';
import { EMPTY_CHARACTER_IMAGE } from '../js/data/characterAsset.js';
import { CHARACTER_STYLES, characterSpriteSVG, characterFaceSVG, paintCharacterSprite } from '../js/components/CharacterSprite.js';

test('runtime source no longer requests deleted character files', () => {
    for (const directory of ['../js/', '../css/']) {
        const root = new URL(directory, import.meta.url);
        for (const file of readdirSync(root, { recursive: true })) {
            if (!/\.(js|css)$/.test(file)) continue;
            assert.doesNotMatch(readFileSync(new URL(file.replaceAll('\\', '/'), root), 'utf8'), /assets\/characters\/(?!(?:manager-park|dog-rgb-motion-v1|3d\/(?:somangi|moa|tori|bongbong|chagok))\/)/, file);
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

function readModel(url) {
    const data = readFileSync(new URL(url));
    assert.equal(data.toString('ascii', 0, 4), 'glTF');
    assert.equal(data.readUInt32LE(4), 2);
    assert.equal(data.readUInt32LE(8), data.length);
    return JSON.parse(data.toString('utf8', 20, 20 + data.readUInt32LE(12)));
}

test('approved Somangi walk/eat/sideways and clothing-free Moa assets are installed', () => {
    assert.deepEqual(Object.keys(SOMANGI_MODELS).sort(), ['eat', 'sideways', 'walk']);
    for (const { file, clip } of Object.values(SOMANGI_MODELS)) {
        const model = readModel(somangiAssetUrl(file));
        assert.ok(model.animations.some(animation => animation.name === clip), clip);
    }
    const moa = readModel(moaAssetUrl('moa.glb'));
    for (const mood of MOA_LEAF_MOODS) {
        assert.ok(moa.animations.some(animation => animation.name === `Moa_Leaf_${mood[0].toUpperCase()}${mood.slice(1)}`), mood);
    }
    for (const entry of [...moa.nodes, ...(moa.meshes || [])]) {
        assert.doesNotMatch(entry.name || '', /vest|clothes|apron|Anna_Vest/i);
    }
    assert.equal(SOMANGI_EXPRESSIONS.length, 14);
    for (const assetUrl of [somangiAssetUrl, moaAssetUrl]) {
        const manifest = JSON.parse(readFileSync(new URL(assetUrl('manifest.json')), 'utf8'));
        for (const [file, expected] of Object.entries(manifest.files)) {
            const data = readFileSync(new URL(assetUrl(file.replaceAll('\\', '/'))));
            assert.equal(createHash('sha256').update(data).digest('hex'), expected, file);
        }
        for (const expression of SOMANGI_EXPRESSIONS) {
            for (const suffix of ['', '-specular']) {
                const png = readFileSync(new URL(assetUrl(`faces/${expression}${suffix}.png`)));
                assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
            }
        }
    }
    for (const name of ['agent-k', 'anna']) {
        assert.equal(existsSync(new URL(`../assets/characters/3d/${name}/`, import.meta.url)), false, name);
    }
    for (const file of ['jump.glb', 'wave.glb', 'crab.glb', 'office-sit.glb']) {
        assert.equal(existsSync(new URL(somangiAssetUrl(file))), false, file);
    }
});

test('approved Tori, Bongbong and Chagok assets load into their rooms', async t => {
    t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
        const data = readModel(url);
        assert.ok(data.meshes.length > 0);
        return {scene: new THREE.Group(), animations: (data.animations || []).map(a => new THREE.AnimationClip(a.name, 1, []))};
    });
    const {addBankChagok} = await import('../js/components/bank3d/BankChagok.js');
    for (const [setup, name] of [[addCipherAgentK, 'tori-character'], [addVivianShopkeeper, 'bongbong-character'], [addBankChagok, 'chagok-character']]) {
        const scene = new THREE.Scene(), root = await setup(scene);
        assert.equal(root.name, name);
        assert.equal(root.parent, scene);
        assert.equal(root.children.length, 1);
        assert.ok(root.children[0].scale.x > 0);
    }
});

test('Somangi loads walk/eat, follows movement and blocks manual eating during dialogue', async t => {
    // Fake downloads only: exercise the real clone, animation and controller paths.
    t.mock.method(GLTFLoader.prototype, 'loadAsync', async () => ({
        scene: new THREE.Group(),
        animations: Object.values(SOMANGI_MODELS).map(({ clip }) => new THREE.AnimationClip(clip, 1, []))
    }));
    const hint = {};
    const priorDocument = globalThis.document;
    t.after(() => { globalThis.document = priorDocument; });
    globalThis.document = { createElement: () => hint };
    const priorWindow = globalThis.window;
    globalThis.window = { addEventListener() {} };
    t.after(() => { globalThis.window = priorWindow; });
    const scene = new THREE.Scene();
    let blocked = false;
    const controller = { renderPosition: { x: 100, y: 200 }, facing: 'right' };
    const town = { playerController: controller, callbacks: { isInputBlocked: () => blocked } };
    const player = new SomangiPlayer(scene, town, { append(element) { assert.equal(element, hint); } });
    await player.ready;
    // Avoid image decoding in Node; expression textures are checked against manifests above.
    player.setExpression = async () => true;
    let foodId;
    t.mock.method(player.food, 'start', id => {foodId = id;});
    assert.equal(player.variants.size, 3);
    assert.equal(player.root.children.length, 3);
    assert.equal(player.state, 'idle');
    controller.renderPosition = { x: 120, y: 200 };
    player.update(.1);
    assert.equal(player.state, 'walk');
    assert.equal(player.play('eat'), false);
    player.update(.1);
    assert.equal(player.state, 'idle');
    blocked = true;
    assert.equal(player.play('eat'), false);
    blocked = false;
    assert.equal(player.play('eat'), true);
    assert.equal(player.state, 'eat');
    assert.equal(foodId, 'item_popori_bread');
    assert.equal(player.play('eat'), false);
    const eating = player.variants.get('eat');
    eating.mixer.update(1.1);
    assert.equal(player.state, 'idle');
    assert.equal(player.play('jump'), true);
    player.jump.cancel(); player.setState('idle');
    for (const action of ['wave', 'crab', 'office-sit']) assert.equal(player.play(action), false);
    assert.equal(player.root.position.x, 120);
    assert.equal(player.root.position.z, 200 / GROUND_PROJECTION);
    assert.equal(player.root.rotation.y, Math.PI / 2);
});

test('information room preserves furniture but contains no embedded Moa meshes', () => {
    const data = readFileSync(new URL('../assets/office/3d/Information-furnished-room.glb', import.meta.url));
    assert.equal(data.toString('ascii', 0, 4), 'glTF');
    assert.equal(data.readUInt32LE(4), 2);
    assert.equal(data.readUInt32LE(8), data.length);
    const room = JSON.parse(data.toString('utf8', 20, 20 + data.readUInt32LE(12)));
    const retired = /^(Anna_PlumpLeaf|Anna_Vest|Eating_Torso|Rigid_Arm\.[LR]|Somangi_Body)(?:\.\d+)?$/;
    for (const node of [...room.nodes, ...(room.meshes || [])]) assert.doesNotMatch(node.name || '', retired);
    assert.ok(room.nodes.some(node => node.name === 'Cream_Desk_Body'));
    assert.ok(room.nodes.some(node => node.name === 'Seat_Sage_Cushion'));
});
