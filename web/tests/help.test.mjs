import test from 'node:test';
import assert from 'node:assert/strict';
import { HelpModal, HELP_PAGES } from '../js/components/HelpModal.js';
import { settingsStore } from '../js/engine/SettingsStore.js';

test('visual guide paginates, displays assigned keys and never places a real order', () => {
    const before=settingsStore.value, doc=globalThis.document;
    const fields=new Map();
    const element=()=>({textContent:'',innerHTML:'',classList:{toggle(){}},setAttribute(){},querySelector(){return {textContent:'',append(){}};},querySelectorAll(){return [];}});
    const guide=Object.create(HelpModal.prototype);
    guide.tabs={children:HELP_PAGES.map(element)};
    guide.dialog={querySelector(selector){if(!fields.has(selector))fields.set(selector,element());return fields.get(selector);},querySelectorAll(){return [];}};
    globalThis.document={querySelector(){return null;}};
    try {
        settingsStore.value={...before,keyBindings:{...before.keyBindings,f:'KeyQ',w:'KeyZ'}};
        guide.showPage(-1); assert.equal(guide.index,0);
        assert.match(fields.get('.help-visual').innerHTML,/data-game-key="w">Z/);
        guide.showPage(1); assert.match(fields.get('.help-visual').innerHTML,/data-game-key="f">Q/);
        assert.match(fields.get('.help-visual').innerHTML,/VivianStore\.png/);
        guide.showPage(2); assert.match(fields.get('.help-visual').innerHTML,/주문이 실행되지 않습니다/);
        guide.showPage(3);
        assert.match(fields.get('.help-visual').innerHTML,/BenchSimple\.png/);
        assert.match(fields.get('.help-visual').innerHTML,/data-game-key="f">Q/);
        assert.match(fields.get('.help-description').textContent,/하루 1회/);
        assert.match(fields.get('.help-description').textContent,/기력을 모두 회복/);
        guide.showPage(100); assert.equal(guide.index,HELP_PAGES.length-1);
        assert.equal(fields.get('[data-help="next"]').disabled,true);
        assert.match(fields.get('.help-visual').innerHTML,/item_energy_drink\.png/);
        assert.match(fields.get('.help-description').textContent,/하트 1개/);
    } finally {settingsStore.value=before;globalThis.document=doc;}
});
