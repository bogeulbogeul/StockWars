// The user explicitly retired these screens, including their gameplay entry points.
// Retain controller/data references for old saves; none of these views is interactive.
const LEGACY_VIEWS = [
    'smartphoneUI', 'tradeModal', 'detailedChartModal', 'newsDetailModal',
    'settlementModal', 'friendModal', 'rankingModal', 'settingsModal',
    'playerProfileModal', 'furnitureEditModal',
    'serverSelectModal', 'characterCreation', 'playerSocial', 'itemCenter', 'cipherLobby'
];
const ROOT_KEYS = ['modal', 'modalOverlay', 'dialog', 'overlay', 'panel', 'giftPanel', 'encounterHint',
    'launch', 'banner', 'boostDialog', 'passPopup'];
const OPEN_METHODS = ['open', 'show', 'toggle', 'showPhone', 'togglePhone',
    'showHomeScreen', 'showStockApp', 'showBubbleApp', 'showStatBoost', 'openGift'];

function retireRoot(root) {
    if (!(root instanceof HTMLElement)) return;
    if (root instanceof HTMLDialogElement) {
        if (root.open) root.close();
        root.show = root.showModal = () => false;
    }
    root.hidden = true;
    root.classList.add('hidden');
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
    root.dataset.retiredNeonUi = '';
    root.style.setProperty('display', 'none', 'important');
}

function retireView(view) {
    if (!view) return;
    view.interfaceRetired = true;
    if (typeof view.isOpen === 'boolean') view.isOpen = false;
    for (const key of ROOT_KEYS) retireRoot(view[key]);
    if (view.rumorPopup) {
        retireRoot(view.rumorPopup.modal);
        view.rumorPopup.open = () => false;
    }
    for (const method of OPEN_METHODS) if (typeof view[method] === 'function') view[method] = () => false;
    if (view.giftDelivery) retireView(view.giftDelivery);
}

export function retireNeonInterface(app) {
    document.body.classList.add('neon-interface-retired');
    for (const name of LEGACY_VIEWS) retireView(app[name]);
    retireView(app.cipherLobby?.trainingRoom);
    retireView(app.cipherLobby?.competitionRoom);
    document.querySelectorAll('.device-container, #floatingPhoneBtn, .rent-quest, .social-inbox-button').forEach(retireRoot);
    document.body.classList.remove('phone-view-active');
    document.body.classList.add('phone-minimized');
}
