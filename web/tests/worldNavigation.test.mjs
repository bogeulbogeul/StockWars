import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { TOWN_MODEL_BUILDINGS } from '../js/data/townModelBuildings.js';
import { registerNickname } from '../js/engine/NicknameRegistration.js';

const source = fs.readFileSync(new URL('../js/app/WorldNavigation.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export const worldNavigation', 'globalThis.worldNavigation');

test('town appears only after server accepts entry, office departure releases membership', async () => {
    let accepted = false;
    let shown = false;
    let left = false;
    const classes = new Set();
    const bridge = {
        claimNickname: async () => ({ snapshot: { uniqueNicknames: true } }),
        join: async () => accepted ? { snapshot: { channels: [{id: 'town-1', name: '타운 1'}], currentChannelId: 'town-1', ping: 8 } } : { error: 'offline' },
        leave: async () => { left = true; }
    };
    let homeShown = 0, homeHidden = 0, entered = 0, departed = 0;
    const home = TOWN_MODEL_BUILDINGS.find(building => building.id === 'home_office_tower');
    const playerController = {charPosX: home.x + (home.entranceOffsetX || 0), charPosY: home.y + 65};
    class HomeModelScene {
        constructor(container, onExit) { this.onExit = onExit; }
        show() { this.active = true; homeShown++; }
        hide() { this.active = false; homeHidden++; }
    }
    const context = vm.createContext({
        async enterBuildingOnFoot(town, id) { assert.equal(id, home.id); entered++; },
        async leaveBuildingOnFoot({room, id, showTown}) {
            assert.equal(room, app.homeModelScene); assert.equal(id, home.id);
            departed++; return showTown();
        }, HomeModelScene, TOWN_MODEL_BUILDINGS, registerNickname, window: { stockWarsPresence: bridge },
        document: { body: { classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) } } }, toastManager: { show() {} } });
    vm.runInContext(source, context);
    const app = { ...context.worldNavigation, userProfile: { nickname: '트레이더' }, townStage: { playerController, viewportEl: { clientWidth: 1200, clientHeight: 900 }, show(server) { shown = server.id; }, hide() {} },
        officeStage: { show() {}, hide() {} }, serverSelectModal: { close() {}, applyPresence() {} } };
    assert.equal(await app.enterTown(), false);
    assert.equal(shown, false);
    accepted = true;
    assert.equal(await app.enterTown(), true);
    assert.equal(shown, 'town-1');
    assert.equal(classes.has('town-mode-active'), true);
    await app.enterOffice();
    assert.equal(left, true);
    assert.equal(classes.has('town-mode-active'), false);
    assert.equal(homeShown, 1);
    const homeScene = app.homeModelScene;
    accepted = false;
    await homeScene.onExit();
    assert.equal(classes.has('town-mode-active'), false);
    assert.equal(departed, 1);
    accepted = true;
    await homeScene.onExit();
    assert.equal(classes.has('town-mode-active'), true);
    assert.equal(homeHidden, 1);
    assert.equal(departed, 2);
    assert.equal(entered, 1);
    playerController.charPosX = home.x + 1000;
    assert.equal(await app.enterOffice(), false);
    assert.equal(entered, 1);
    playerController.charPosX = home.x + (home.entranceOffsetX || 0);
    await app.enterOffice();
    assert.equal(app.homeModelScene, homeScene);
    assert.equal(homeShown, 2);
});
