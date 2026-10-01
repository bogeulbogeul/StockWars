import { ItemEngine } from '../engine/ItemEngine.js';
import { ItemCenter } from '../components/ItemCenter.js';
import { INITIAL_STOCKS } from '../data/stocksData.js?v=v72';

const SAVE_KEY = 'stockwars-item-gameplay-v1';

export function installItemGameplay(app, market, { saveKey = SAVE_KEY } = {}) {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(saveKey)); } catch { /* First run or corrupt save. */ }
    if (saved?.items?.version !== 1 || !Array.isArray(saved?.items?.inventory) || !Array.isArray(saved?.market?.stocks)) saved = null;
    if (saved) {
        market.cash = saved.market.cash;
        market.initialCash = saved.market.initialCash;
        market.day = saved.market.day;
        market.portfolio = new Map(saved.market.portfolio);
        market.stocks = new Map(saved.market.stocks);
        market.priceHistory = new Map(saved.market.history);
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
    app.itemEngine = engine;
    app.mainHUD.callbacks.getTime = () => engine.now();
    market.itemEngine = engine;
    let lastSaved = 0;
    let storageWarning = false;
    function save(force = true) {
        if (!force && Date.now() - lastSaved < 1000) return;
        try {
            localStorage.setItem(saveKey, JSON.stringify({ items: engine.state, profile: app.userProfile,
                market: { cash: market.cash, initialCash: market.initialCash, day: market.day,
                    portfolio: [...market.portfolio], stocks: [...market.stocks], history: [...market.priceHistory] } }));
            lastSaved = Date.now();
        } catch {
            if (!storageWarning) engine.notice('저장 공간을 사용할 수 없습니다. 현재 세션에서만 유지됩니다.');
            storageWarning = true;
        }
    }
    function sync() {
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
    const activate = id => {
        const result = engine.use(id);
        sync();
        app.itemCenter.open(result.message);
        return result;
    };
    app.itemGameplay = {
        sync, save,
        restOnBench() { const result = engine.restOnBench(); if (result.success) sync(); return result; },
        purchase(id, quantity, instant) { const r = engine.purchase(id, quantity, instant); sync(); return r; },
        activate,
        reset() {
            engine.state = new ItemEngine({ market }).state;
            const trait = app.userProfile?.trait?.key;
            if (trait in engine.state.baseStats) engine.state.baseStats[trait]++;
            app.itemCenter.dialog.close();
            sync();
        }
    };
    const baseUpdateStamina = app.mainHUD.updateStamina.bind(app.mainHUD);
    app.mainHUD.updateStamina = (value, max = 3) => {
        engine.state.stamina = Math.max(0, Math.min(max, value));
        baseUpdateStamina(value, max);
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
        if (day !== engine.state.purchaseDay || cash !== market.cash || active !== engine.state.swanActive) sync();
        app.itemCenter.refreshStatus();
        save(false);
    }, 1000);
}
