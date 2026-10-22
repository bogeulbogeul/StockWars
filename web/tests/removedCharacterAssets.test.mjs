import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { SOMANGI_MODELS } from '../js/data/somangiModels.js';
import * as THREE from '../vendor/three/three.module.js';
import { SomangiPlayer } from '../js/components/town3d/SomangiPlayer.js';
import { addCipherAgentK } from '../js/components/cipher3d/CipherAgentK.js';
import { addSleepingAnna } from '../js/components/town3d/SleepingAnna.js';
import { addVivianShopkeeper } from '../js/components/store3d/VivianShopkeeper.js';
import { GROUND_PROJECTION } from '../js/data/townModelBuildings.js';
import { EMPTY_CHARACTER_IMAGE } from '../js/data/characterAsset.js';
import { CHARACTER_STYLES, characterSpriteSVG, characterFaceSVG, paintCharacterSprite } from '../js/components/CharacterSprite.js';

test('runtime source no longer requests deleted character files', () => {
    for (const directory of ['../js/', '../css/']) {
        const root = new URL(directory, import.meta.url);
        for (const file of readdirSync(root, { recursive: true })) {
            if (!/\.(js|css)$/.test(file)) continue;
            assert.doesNotMatch(readFileSync(new URL(file.replaceAll('\\', '/'), root), 'utf8'), /assets\/characters\/(?!(?:manager-park|dog-rgb-motion-v1)\/)/, file);
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

test('retired character model, texture and motion directories are absent', () => {
    assert.deepEqual(SOMANGI_MODELS, {});
    for (const name of ['somangi', 'agent-k', 'anna', 'bongbong']) {
        assert.equal(existsSync(new URL(`../assets/characters/3d/${name}/`, import.meta.url)), false, name);
    }
});

test('NPC setup leaves room scenes empty instead of restoring replacement models', async () => {
    const scene = new THREE.Scene();
    for (const setup of [addCipherAgentK, addSleepingAnna, addVivianShopkeeper]) {
        assert.equal(await setup(scene), null);
        assert.equal(scene.children.length, 0);
    }
});

test('player retains only an empty moving camera anchor and no playable motions', async t => {
    const previousDocument = globalThis.document;
    globalThis.document = { createElement: () => ({}) };
    t.after(() => { globalThis.document = previousDocument; });
    const scene = new THREE.Scene();
    const controller = { renderPosition: { x: 100, y: 200 }, facing: 'right', somangiCrabManual: true };
    const player = new SomangiPlayer(scene, { playerController: controller });
    await player.ready;
    assert.deepEqual(scene.children, [player.root]);
    assert.equal(player.root.children.length, 0);
    assert.equal(player.variants.size, 0);
    assert.equal(player.hint.hidden, true);
    for (const action of ['walk', 'wave', 'eat', 'jump', 'crab', 'office-sit']) {
        assert.equal(player.play(action), false);
        player.setState(action);
        assert.equal(player.root.children.length, 0);
    }
    controller.renderPosition = { x: 320, y: 180 };
    player.update();
    assert.equal(player.root.position.x, 320);
    assert.equal(player.root.position.z, 180 / GROUND_PROJECTION);
    assert.equal(player.root.rotation.y, Math.PI / 2);
    assert.equal(controller.somangiCrab, false);
    assert.equal(controller.somangiCrabSuspended, true);
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
