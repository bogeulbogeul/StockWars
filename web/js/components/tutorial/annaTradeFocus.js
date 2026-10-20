// Highlight a lesson's controls without dimming any of their ancestors.
const targetsByStep = {
    open_company_info: '#btnSubtabInfo',
    company_info_business: '#tradeSubtabInfoContent .info-section:nth-child(1)',
    company_info_per: '#tradeSubtabInfoContent .info-stat-card:has(#infoPER)',
    company_info_pbr: '#tradeSubtabInfoContent .info-stat-card:has(#infoPBR)',
    company_info_roe: '#tradeSubtabInfoContent .info-stat-card:has(#infoROE)',
    company_info_dividend: '#tradeSubtabInfoContent .info-stat-card:has(#infoDividend)',
    company_info_market_cap: '#tradeSubtabInfoContent .info-stat-card:has(#infoMarketCap)',
    company_info_high_low: '#tradeSubtabInfoContent .info-stat-card:has(#infoHighLow)',
    company_info_risk: '#tradeSubtabInfoContent .info-stat-card:has(#infoRisk)',
    company_info_tier: '#tradeSubtabInfoContent .info-stat-card:has(#infoTier)',
    company_info_metrics: '#tradeSubtabInfoContent .info-section:nth-child(2)',
    company_info_news: '#tradeSubtabInfoContent .info-section:nth-child(3)',
    company_info_return: '#btnSubtabChart',
    open_order_screen: '#btnSubtabOrder',
    stock_basics_price: '.modal-price-header, #btnExpandChart',
    chart_colors: '.modal-price-header, .chart-color-guide, #btnExpandChart',
    chart_detail: '#btnExpandChart',
    market_order_guide: '#tradeOrderTypeControl',
    limit_order_guide: '#tradeOrderTypeControl, .limit-order-controls > label:has(#tradeLimitPrice)',
    stock_basics_profit: '.order-action-btns',
    stock_profit_example: '.modal-price-header, .total-calc-box',
    stock_profit_fees: '.total-calc-box',
    buy_stock: '#tradeOrderTypeControl, .qty-selector, .total-calc-box, #btnBuyExecute',
    first_profit_choice: '.modal-price-header, #btnSellExecute',
    first_sell_guide: '.qty-selector, .total-calc-box, #btnSellExecute',
    celebrate: '#btnCloseTradeModal',
};

export function annaTradeTab(stepId) {
    if (stepId === 'open_order_screen' || stepId.startsWith('company_info_')) return 'Info';
    return ['order_screen_overview', 'market_order_guide', 'limit_order_guide', 'stock_basics_profit',
        'stock_profit_example', 'stock_profit_fees', 'buy_stock',
        'first_profit_choice', 'first_sell_guide'].includes(stepId) ? 'Order' : 'Chart';
}

const accountTargets = {
    sector_allocation_guide: '.sector-allocation-card',
    social_and_ranking_guide: '#portfolioListContainer',
    portfolio_slots_guide: '#portfolioSlotStatus, #portfolioListContainer',
    portfolio_slots_growth: '#portfolioSlotStatus',
    portfolio_slots_capacity: '#portfolioSlotStatus, #portfolioListContainer',
    portfolio_slots_trait: '#portfolioSlotStatus',
    trade_history_guide: '.trade-history-menu',
    trade_history_fees: '#tradeHistoryList'
};

export function clearAnnaTradeFocus(root = document) {
    root?.querySelectorAll('.anna-trade-dim, .anna-trade-target').forEach(element => {
        element.classList.remove('anna-trade-dim', 'anna-trade-target');
    });
}

export function applyAnnaTradeFocus(stepId, root, chartSelector) {
    const hudTargets = { hud_overview: '.main-hud-bar', hud_cash_guide: '.hud-asset-item:has(#hudCashVal)', hud_assets_guide: '.hud-asset-item:has(#hudTotalAssetVal)', hud_profit_guide: '.hud-asset-item:has(#hudPnlVal)' };
    Object.assign(hudTargets, { hud_day_guide: '.day-badge', hud_time_guide: '#hudClockItem', hud_weather_guide: '#hudWeatherItem', hud_stamina_guide: '#hudStaminaItem', hud_profile_guide: '#btnHudProfile', hud_inventory_guide: '#btnHudInventory', hud_ranking_guide: '#btnHudRanking', hud_settings_guide: '#btnHudSettings' });
    if (hudTargets[stepId]) {
        root ??= document.querySelector('.main-hud-bar');
        chartSelector = hudTargets[stepId];
        if (stepId === 'hud_overview') { clearAnnaTradeFocus(); return; }
    }
    if (stepId === 'close_inventory_guide') {
        root ??= document.querySelector('#inventoryModal');
        chartSelector = '#btnCloseInventory';
    }
    const serverTargets = { server_population: '.town-autoscale-status-bar, .cyber-current-chip', server_channels: '#townChannelsGrid, .cyber-modal-footer', server_enter: '#townChannelsGrid, #btnQuickConnect' };
    if (stepId.startsWith('server_')) root ??= document.querySelector('#serverSelectModal');
    const accountSelector = accountTargets[stepId];
    root ??= document.querySelector(chartSelector ? '#detailedChartModal' : accountSelector ? '#stockApp' : '#tradeModal');
    clearAnnaTradeFocus();
    const selector = serverTargets[stepId] || chartSelector || accountSelector || targetsByStep[stepId];
    if (!root || !selector) return;
    if (accountSelector && stepId.startsWith('trade_history_')) {
        const menu = root.querySelector('.trade-history-menu');
        if (menu) menu.open = true;
    }
    const targets = [...root.querySelectorAll(selector)];
    if (!targets.length) return;
    targets.forEach(target => target.classList.add('anna-trade-target'));
    const visit = parent => {
        for (const child of parent.children) {
            if (targets.includes(child)) continue;
            if (targets.some(target => child.contains(target))) visit(child);
            else child.classList.add('anna-trade-dim');
        }
    };
    visit(root);
    if (accountSelector || stepId.startsWith('company_info_')) {
        const target = targets[0], scroller = target.closest('.app-body') || target.closest('.modal-card') || root;
        if (scroller?.getBoundingClientRect) {
            const rect = target.getBoundingClientRect(), bounds = scroller.getBoundingClientRect();
            const scale = bounds.height / scroller.offsetHeight || 1;
            if (rect.top < bounds.top + 8) scroller.scrollTop += (rect.top - bounds.top) / scale - 8;
            else if (rect.bottom > bounds.bottom - 8) scroller.scrollTop += (rect.bottom - bounds.bottom) / scale + 8;
        }
    }
}
