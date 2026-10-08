import test from 'node:test';
import assert from 'node:assert/strict';
import { TownStage } from '../js/components/TownStage.js';
globalThis.document = { getElementById() { return {}; } };
const { PlayerSocial } = await import('../js/components/PlayerSocial.js');
delete globalThis.document;

function element() { return { hidden: true, children: [], style: {}, append(...children) { this.children.push(...children); }, replaceChildren() { this.children = []; } }; }
test('encounter guide is optional, persists dismissal and never sends a friend request', () => {
    const original = globalThis.document;
    globalThis.document = { createElement: element };
    try {
        let saves = 0, opened = 0;
        const social = Object.assign(Object.create(PlayerSocial.prototype), {
            app: { itemEngine: { state: {} }, itemGameplay: { save() { saves++; } } },
            state: { friends: [] }, dialog: { open: false }, encounterHint: element(),
            button(label, handler) { return { label, handler }; }, open() { opened++; }
        });
        const player = { id: 'peer', nickname: '<img src=x>' };
        social.encounter(player);
        assert.equal(social.encounterHint.hidden, false);
        assert.equal(social.encounterHint.children[1].textContent, '<img src=x>님을 만났어요!');
        assert.equal(opened, 0);
        const actions = social.encounterHint.children[3].children;
        actions[0].handler(); assert.equal(opened, 1);
        social.encounter(null); assert.equal(social.encounterHint.hidden, true);
        social.encounter(player); actions[1].handler();
        assert.equal(saves, 1); assert.equal(social.app.itemEngine.state.townFriendTutorialSeen, true);
        social.encounter(player); assert.equal(social.encounterHint.hidden, true);
        delete social.app.itemEngine.state.townFriendTutorialSeen;
        social.state.friends = [{ id: 'peer' }]; social.encounter(player);
        assert.equal(social.encounterHint.hidden, true);
        social.state.friends = []; social.app.annaTutorial = { isActive: true };
        social.encounter(player); assert.equal(social.encounterHint.hidden, true);
    } finally { globalThis.document = original; }
});

test('town encounter selects nearest visible player and clears when players leave', () => {
    let encountered;
    const town = {
        playerController: { charPosX: 10, charPosY: 10 },
        remotePlayers: new Map([
            ['hidden', { x: 10, y: 10, element: { style: { display: 'none' } }, player: { id: 'hidden' } }],
            ['close', { x: 50, y: 50, element: { style: {} }, player: { id: 'close' } }],
            ['far', { x: 1000, y: 1000, element: { style: {} }, player: { id: 'far' } }]
        ]),
        callbacks: { onPlayerEncounter(player) { encountered = player; } }
    };
    TownStage.prototype.checkProximity.call(town);
    assert.equal(encountered.id, 'close');
    town.remotePlayers.clear(); TownStage.prototype.checkProximity.call(town);
    assert.equal(encountered, null);
});
