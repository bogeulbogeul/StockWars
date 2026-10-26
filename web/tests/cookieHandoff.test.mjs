import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshBasicMaterial, Box3, Vector3 } from '../vendor/three/three.module.js';
import { singleHoneyCookie } from '../js/app/exhibition/CookieHandoff.js';
import { freshState, complete } from '../js/app/exhibition/State.js';

test('one cookie is detached without its tray or other cookies and source remains intact', () => {
    const source = new Group();
    for (const name of ['Cookie_1', 'Cookie_2', 'Paper_Liner']) {
        const part = new Group(); part.name = name;
        part.add(new Mesh(new BoxGeometry(10, 2, 10), new MeshBasicMaterial())); source.add(part);
    }
    const item = singleHoneyCookie(source);
    assert(item.getObjectByName('Cookie_1'));
    assert(!item.getObjectByName('Cookie_2')); assert(!item.getObjectByName('Paper_Liner'));
    assert.equal(source.children.length, 3);
    assert.equal(new Box3().setFromObject(item).getSize(new Vector3()).x, 22);
});

test('cookie requires both activities and recovers one heart only once, capped at three', () => {
    const state = freshState(); state.stamina = 2;
    assert.equal(complete(state, 'cookie'), false); assert.equal(state.stamina, 2);
    Object.assign(state.flags, { trade: true, packing: true, rumor: true });
    assert(complete(state, 'cookie')); assert.equal(state.stamina, 3);
    assert.equal(complete(state, 'cookie'), false); assert.equal(state.stamina, 3);
});
