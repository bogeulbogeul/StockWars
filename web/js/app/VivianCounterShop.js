// Reuse the existing catalog and purchase engine without changing its room module.
export function openVivianCounterShop(app) {
    const shop = app.vivianStoreModal;
    if (!shop) return;
    shop.open();
    shop.player.stop();
    cancelAnimationFrame(shop.playerFrame);
    shop.isShopping = true;
    shop.modalEl.classList.add('vivian-counter-only');
    shop.interiorEl.inert = true;
    shop.shopPanel.classList.remove('hidden');
    shop.updateHeaderInfo();
    shop.switchTab('daily');
    shop.btnClose?.focus();
    if (!shop.counterBackBound) {
        shop.counterBackBound = true;
        const close = shop.close.bind(shop);
        shop.close = () => {
            shop.modalEl.classList.remove('vivian-counter-only');
            close();
        };
        shop.modalEl.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (app.vivianModelScene?.active && button && /돌아|뒤로/.test(button.textContent)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                shop.close();
            }
        }, true);
    }
}
