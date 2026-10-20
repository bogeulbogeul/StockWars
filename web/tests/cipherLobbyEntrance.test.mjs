import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { TOWN_MODEL_BUILDINGS } from '../js/data/townModelBuildings.js';

const source = readFileSync(new URL('../js/app/CipherLobbyEntrance.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace('export function installCipherLobbyEntrance', 'function installCipherLobbyEntrance');

test('legacy Cipher entry opens the 3D lobby and returns only after town accepts entry', async () => {
    const classes = new Set(['ui-paused', 'town-mode-active']);
    let lobbyShown = 0, lobbyHidden = 0, townHidden = 0, connections = 0, cameraUpdates = 0;
    let accepted = false;
    class CipherLobbyScene {
        constructor(container, onExit) { this.onExit = onExit; }
        show() { lobbyShown++; }
        hide() { lobbyHidden++; }
    }
    const context = vm.createContext({ CipherLobbyScene, TOWN_MODEL_BUILDINGS,
        connectCipherLobbyRooms() { connections++; }, gameKey: () => 'f',
        window: { addEventListener() {} }, location: { search: '' }, URLSearchParams,
        document: { createElement: () => ({}), body: { classList: {
            contains: name => classes.has(name), remove: name => classes.delete(name)
        } } }
    });
    vm.runInContext(source, context);
    const player = { charPosX: 2030, charPosY: 1800, keysHeld: new Set(['w']), isMoving: true,
        updateCamera() { cameraUpdates++; } };
    const app = { cipherLobby: {}, townStage: { playerController: player,
        viewportEl: { append() {}, clientWidth: 1200, clientHeight: 900 },
        containerEl: { classList: { contains: () => false } }, callbacks: {}, hide() { townHidden++; }
    }, async enterTown() { if (accepted) classes.add('town-mode-active'); return accepted; } };
    context.installCipherLobbyEntrance(app);
    app.cipherLobby.open();
    assert.equal(lobbyShown, 1);
    assert.equal(townHidden, 1);
    assert.equal(connections, 1);
    assert.equal(classes.has('town-mode-active'), false);
    assert.equal(player.keysHeld.size, 0);
    assert.equal(player.isMoving, false);
    const lobby = app.cipherLobbyScene;
    player.charPosX = 0; player.charPosY = 0;
    await lobby.onExit();
    assert.equal(lobbyHidden, 0);
    assert.equal(cameraUpdates, 0);
    accepted = true;
    await lobby.onExit();
    assert.equal(lobbyHidden, 1);
    assert.equal(classes.has('town-mode-active'), true);
    assert.deepEqual([player.charPosX, player.charPosY], [2030, 1800]);
    assert.equal(player.facing, 'down');
    assert.equal(cameraUpdates, 1);
    app.cipherLobby.open();
    assert.equal(app.cipherLobbyScene, lobby);
    assert.equal(connections, 1);
    assert.equal(lobbyShown, 2);
});
