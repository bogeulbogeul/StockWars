import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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
    const context = vm.createContext({ registerNickname, window: { stockWarsPresence: bridge },
        document: { body: { classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) } } }, toastManager: { show() {} } });
    vm.runInContext(source, context);
    const app = { ...context.worldNavigation, userProfile: { nickname: '트레이더' }, townStage: { show(server) { shown = server.id; }, hide() {} },
        officeStage: { show() {}, hide() {} }, serverSelectModal: { close() {}, applyPresence() {} } };
    assert.equal(await app.enterTown(), false);
    assert.equal(shown, false);
    accepted = true;
    assert.equal(await app.enterTown(), true);
    assert.equal(shown, 'town-1');
    assert.equal(classes.has('town-mode-active'), true);
    app.enterOffice();
    assert.equal(left, true);
    assert.equal(classes.has('town-mode-active'), false);
});
