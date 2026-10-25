import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { TOWN_MODEL_BUILDINGS } from '../js/data/townModelBuildings.js';

const source = readFileSync(new URL('../js/app/CipherLobbyEntrance.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace('export function installCipherLobbyEntrance', 'function installCipherLobbyEntrance');

test('legacy Cipher entry requires walking to the entrance and uses doorway travel in both directions', async () => {
    const classes = new Set(['town-model-mode', 'town-mode-active']);
    let lobbyShown = 0, lobbyHidden = 0, townHidden = 0, connections = 0, entryWalks = 0, exitWalks = 0;
    let accepted = false;
    class CipherLobbyScene {
        constructor(container, onExit) { this.onExit = onExit; }
        show() { lobbyShown++; }
        hide() { lobbyHidden++; }
    }
    const context = vm.createContext({ CipherLobbyScene, TOWN_MODEL_BUILDINGS,
        async enterExteriorDoorOnFoot() { entryWalks++; assert.equal(lobbyShown, 0); },
        async leaveBuildingOnFoot({ room, showTown }) { exitWalks++; if (await showTown() !== false) room.hide(); },
        connectCipherLobbyRooms() { connections++; }, gameKey: () => 'f',
        window: { addEventListener() {} }, location: { search: '' }, URLSearchParams,
        document: { createElement: () => ({}), body: { classList: {
            contains: name => classes.has(name), remove: name => classes.delete(name)
        } } }
    });
    vm.runInContext(source, context);
    const player = { charPosX: 2030, charPosY: 1800, keysHeld: new Set(['w']), isMoving: true,
        updateCamera() {} };
    const app = { cipherLobby: {}, townStage: { playerController: player,
        viewportEl: { append() {}, clientWidth: 1200, clientHeight: 900 },
        containerEl: { classList: { contains: () => false } }, callbacks: {}, hide() { townHidden++; }
    }, async enterTown() { if (accepted) classes.add('town-mode-active'); return accepted; } };
    context.installCipherLobbyEntrance(app);
    await app.cipherLobby.open();
    assert.equal(lobbyShown, 0); assert.equal(entryWalks, 0);
    const building = TOWN_MODEL_BUILDINGS.find(b => b.id === 'cipher_securities');
    player.charPosX = building.x; player.charPosY = building.y + 110;
    await app.cipherLobby.open();
    assert.equal(lobbyShown, 1);
    assert.equal(townHidden, 1);
    assert.equal(connections, 1);
    assert.equal(entryWalks, 1);
    assert.equal(classes.has('town-mode-active'), false);
    assert.equal(player.keysHeld.size, 0);
    assert.equal(player.isMoving, false);
    const lobby = app.cipherLobbyScene;
    player.charPosX = 0; player.charPosY = 0;
    await lobby.onExit();
    assert.equal(lobbyHidden, 0);
    assert.equal(exitWalks, 1);
    accepted = true;
    await lobby.onExit();
    assert.equal(lobbyHidden, 1);
    assert.equal(classes.has('town-mode-active'), true);
    assert.deepEqual([player.charPosX, player.charPosY], [0, 0]);
    assert.equal(exitWalks, 2);
    await app.cipherLobby.open();
    assert.equal(app.cipherLobbyScene, lobby);
    assert.equal(connections, 1);
    assert.equal(lobbyShown, 1);
});
