import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('bootstrap creates the main HUD separately from developer controls and routes navigation', () => {
    const source=fs.readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
    const init=source.slice(source.indexOf('    initComponents() {')+'    initComponents() {'.length, source.indexOf('        // 3. 3D Isometric'));
    class Stub { constructor(container,callbacks={}){this.container=container;this.callbacks=callbacks;} }
    const app={appContainer:{},inventoryModal:{toggle(){app.opened='inventory';}},playerProfileModal:{open(){app.opened='profile';}},rankingModal:{show(){app.opened='ranking';}},settingsModal:{open(){app.opened='settings';}}};
    vm.runInNewContext('function init(){'+init+'} init.call(app);',{app,HelpModal:Stub,TopDemoBar:Stub,MainHUD:Stub});
    assert.ok(app.mainHUD);assert.notEqual(app.mainHUD,app.topDemoBar);
    for(const [key,value] of [['onProfile','profile'],['onInventory','inventory'],['onRanking','ranking'],['onSettings','settings']]){app.mainHUD.callbacks[key]();assert.equal(app.opened,value);}
    assert.equal(app.topDemoBar.callbacks.onInventory,undefined);
});
