import test from 'node:test';
import assert from 'node:assert/strict';

test('F exits the store without reopening it in the town listener', async () => {
    const elements = new Map();
    globalThis.window = new EventTarget();
    globalThis.document = Object.assign(new EventTarget(), {
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, new EventTarget());
            return elements.get(id);
        }
    });
    globalThis.cancelAnimationFrame = () => {};
    const { VivianStoreModal } = await import('../js/components/store/VivianStoreModal.js');
    const { StorePlayerController } = await import('../js/components/store/StorePlayerController.js');
    const { TownStage } = await import('../js/components/TownStage.js');
    let exits = 0, reopens = 0;
    const store = Object.assign(Object.create(VivianStoreModal.prototype), {
        isOpen: true, isShopping: false, player: new StorePlayerController(),
        interiorEl: { querySelectorAll: () => [] },
        modalEl: Object.assign(new EventTarget(), { classList: { add() {} } }),
        callbacks: { onClose: () => exits++ }
    });
    store.initEventListeners();
    const town = Object.assign(Object.create(TownStage.prototype), {
        callbacks: { isInputBlocked: () => store.isOpen }, activeNearbyObject: {},
        playerController: { handleKeyDown() {}, handleKeyUp() {}, keysHeld: new Set() },
        triggerAction() { reopens++; }
    });
    town.initEventListeners();
    const press = (repeat=false) => {
        const event = new Event('keydown', { cancelable: true });
        Object.assign(event, { key: 'f', repeat });
        window.dispatchEvent(event);
    };
    press();
    assert.equal(exits, 1); assert.equal(store.isOpen, false); assert.equal(reopens, 0);
    press(true); assert.equal(reopens, 0, 'holding F must not re-enter');
    press(); assert.equal(reopens, 1, 'a new press can enter normally');
});
