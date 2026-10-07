import { ItemEngine } from '../engine/ItemEngine.js';
import { applyPlayerTrait } from '../engine/PlayerTrait.js';
import { LevelUpNotice } from '../components/LevelUpNotice.js';
import { ItemCenter } from '../components/ItemCenter.js';
import { friendManager } from '../engine/FriendManager.js';
import { INITIAL_STOCKS } from '../data/stocksData.js?v=v72';

const SAVE_KEY = 'stockwars-item-gameplay-v1';

export function installItemGameplay(app, market, { saveKey = SAVE_KEY } = {}) {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(saveKey)); } catch { /* First run or corrupt save. */ }
    if (saved?.items?.version !== 1 || !Array.isArray(saved?.items?.inventory) || !Array.isArray(saved?.market?.stocks)) saved = null;
    // Old completed saves have the tutorial reward marker; unfinished saves cannot resume.
    if (saved && saved.profile?.firstTutorialCompleted !== true && !saved.items.tutorialRewardClaimed) {
        try { localStorage.removeItem(saveKey); } catch {}
        saved = null;
    }
    if (saved) {
        saved.profile.firstTutorialCompleted = true;
        market.cash = saved.market.cash;
        market.initialCash = saved.market.initialCash;
        market.day = saved.market.day;
        market.portfolio = new Map(saved.market.portfolio);
        market.stocks = new Map(saved.market.stocks);
        market.priceHistory = new Map(saved.market.history);
        market.firstTradeLesson = saved.market.firstTradeLesson || null;
        market.limitOrders = saved.market.limitOrders || [];
        app.userProfile = saved.profile;
    }

    // Ensure all 72 stocks from INITIAL_STOCKS are present in market.stocks & metadata is updated
    INITIAL_STOCKS.forEach(stock => {
        const existing = market.stocks.get(stock.id);
        if (!existing) {
            market.stocks.set(stock.id, { ...stock, history: [stock.prevPrice, stock.price] });
        } else {
            existing.name = stock.name;
            existing.desc = stock.desc;
            existing.richDesc = stock.richDesc;
            existing.sector = stock.sector;
            existing.risk = stock.risk;
            existing.tier = stock.tier;
        }
        if (!market.priceHistory.has(stock.id)) {
            const hist = typeof market.generateInitialHistory === 'function'
                ? market.generateInitialHistory(stock.price)
                : [stock.prevPrice, stock.price];
            market.priceHistory.set(stock.id, hist);
        }
    });
    const engine = new ItemEngine({ market, state: saved?.items });
    applyPlayerTrait(engine.state, app.userProfile);
    const levelUpNotice = new LevelUpNotice(app.appContainer, {
        getState: () => ({ level: engine.playerLevel(), points: engine.pendingStatPoints(), stats: engine.state.baseStats }),
        onConfirm: key => {
            const result = engine.allocateLevelStat(key);
            if (result.success) sync();
            return result;
        }
    });
    let gameStarted = false;
    app.itemEngine = engine;
    app.mainHUD.callbacks.getTime = () => engine.now();
    market.itemEngine = engine;
    let lastSaved = 0;
    let storageWarning = false;
    function save(force = true) {
        if (app.userProfile?.firstTutorialCompleted !== true) return false;
        if (!force && Date.now() - lastSaved < 1000) return;
        try {
            localStorage.setItem(saveKey, JSON.stringify({ items: engine.state, profile: app.userProfile,
                market: { cash: market.cash, initialCash: market.initialCash, day: market.day,
                    portfolio: [...market.portfolio], stocks: [...market.stocks], history: [...market.priceHistory], firstTradeLesson: market.firstTradeLesson, limitOrders: market.limitOrders } }));
            lastSaved = Date.now();
            return true;
        } catch {
            if (!storageWarning) engine.notice('저장 공간을 사용할 수 없습니다. 현재 세션에서만 유지됩니다.');
            storageWarning = true;
            return false;
        }
    }
    function sync() {
        if (gameStarted && engine.pendingStatPoints() > 0) levelUpNotice.show();
        app.inventoryModal.items = engine.state.inventory;
        app.mainHUD.updateStamina(engine.state.stamina);
        app.vivianStoreModal.affinity = engine.state.affinity;
        app.vivianStoreModal.purchasedCounts = engine.state.purchases;
        if (!app.inventoryModal.modal.classList.contains('hidden')) app.inventoryModal.renderGrid();
        if (app.vivianStoreModal.isShopping) {
            app.vivianStoreModal.updateHeaderInfo();
            app.vivianStoreModal.renderItemsGrid();
            app.vivianStoreModal.updatePriceCalculation();
        }
        app.itemCenter?.refreshStatus();
        market.notify();
        save();
    }
    app.itemCenter = new ItemCenter(engine, sync);
    const bubble = app.smartphoneUI.bubbleAppModule;
    bubble.callbacks.getShareItems = () => engine.state.inventory;
    bubble.callbacks.shareInventoryItem = (friendId, kind, itemId) => {
        const item = engine.state.inventory.find(entry => entry.id === itemId && entry.quantity > 0);
        if (!item || item.isEquipped || (kind === 'rumor' ? item.category !== 'intel' : item.category === 'intel')) {
            return { success: false, message: '선택한 아이템을 보낼 수 없습니다.' };
        }
        const result = kind === 'rumor' ? friendManager.shareRumor(friendId, item.name, market.day)
            : friendManager.sendEnergyGift(friendId, market.day);
        if (result.success) {
            if (kind === 'gift') engine.consume(item.id, 1);
            sync();
            result.message = kind === 'gift' ? `${item.name} 1개를 선물했습니다. (우호도 +10)` : `${item.name} 정보를 공유했습니다. (원본 유지 · 우호도 +20)`;
        }
        return result;
    };
    const activate = id => {
        const result = engine.use(id);
        sync();
        if (result.success && result.rumorId) {
            const rumor = engine.state.inventory.find(item => item.id === result.rumorId);
            app.inventoryModal.rumorPopup.open(rumor, () => sync());
            return result;
        }
        app.itemCenter.open(result.message, id === 'item_lotto_ticket' ? 'lotto' : '');
        return result;
    };
    app.itemGameplay = {
        sync, save,
        start() { gameStarted = true; sync(); },
        pause() { gameStarted = false; levelUpNotice.close(); },
        restOnBench() { const result = engine.restOnBench(); if (result.success) sync(); return result; },
        purchase(id, quantity, instant) { const r = engine.purchase(id, quantity, instant); sync(); return r; },
        activate,
        reset() {
            engine.state = new ItemEngine({ market }).state;
            applyPlayerTrait(engine.state, app.userProfile);
            levelUpNotice.close();
            engine.state.stamina = engine.maxStamina();
            app.itemCenter.dialog.close();
            sync();
        }
    };
    const baseUpdateStamina = app.mainHUD.updateStamina.bind(app.mainHUD);
    app.mainHUD.updateStamina = value => {
        engine.state.stamina = value;
        engine.normalizeStamina();
        baseUpdateStamina(engine.state.stamina, engine.maxStamina());
    };
    const oldAdd = app.inventoryModal.addItem.bind(app.inventoryModal);
    app.inventoryModal.addItem = item => { const r = oldAdd(item); engine.state.inventory = app.inventoryModal.items; save(); return r; };
    const oldDiscard = app.inventoryModal.discardItem.bind(app.inventoryModal);
    app.inventoryModal.discardItem = id => {
        if (id === 'item_lotto_ticket') { app.itemCenter.open('로또 응모권은 추첨 기록과 연결되어 버릴 수 없습니다.'); return; }
        oldDiscard(id);
        engine.state.inventory = app.inventoryModal.items;
        if (!engine.state.inventory.some(i => i.id === id)) {
            if (id === 'item_gas_mask') engine.state.mask = false;
            if (id === 'item_black_swan_alarm') engine.state.alarm = false;
        }
        sync();
    };
    market.subscribe(() => save(false));
    window.addEventListener('pagehide', () => save());
    engine.tick();
    sync();
    app.itemTimer = setInterval(() => {
        const day = engine.state.purchaseDay, cash = market.cash, active = engine.state.swanActive;
        engine.tick();
        if (day !== engine.state.purchaseDay || cash !== market.cash || active !== engine.state.swanActive || app.mainHUD.stamina?.current !== engine.state.stamina || app.mainHUD.stamina?.max !== engine.maxStamina()) sync();
        app.itemCenter.refreshStatus();
        save(false);
    }, 1000);
}
