// Highlight a lesson's controls without dimming any of their ancestors.
const targetsByStep = {
    stock_basics_price: '.modal-price-header, #btnExpandChart',
    chart_colors: '.modal-price-header, .chart-color-guide, #btnExpandChart',
    chart_detail: '#btnExpandChart',
    market_order_guide: '#tradeOrderTypeControl, .orderbook-panel',
    limit_order_guide: '.limit-order-controls',
    stock_basics_profit: '.order-action-btns',
    stock_profit_example: '.modal-price-header, .total-calc-box',
    stock_profit_fees: '.total-calc-box',
    buy_stock: '#tradeOrderTypeControl, .qty-selector, .total-calc-box, #btnBuyExecute',
    first_profit_choice: '.modal-price-header, #btnSellExecute',
    first_sell_guide: '.qty-selector, .total-calc-box, #btnSellExecute',
    celebrate: '#btnCloseTradeModal',
};

const accountTargets = {
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
    const accountSelector = accountTargets[stepId];
    root ??= document.querySelector(chartSelector ? '#detailedChartModal' : accountSelector ? '#stockApp' : '#tradeModal');
    clearAnnaTradeFocus();
    const selector = chartSelector || accountSelector || targetsByStep[stepId];
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
    if (accountSelector) {
        const target = targets[0], scroller = target.closest('.app-body');
        if (scroller) {
            const rect = target.getBoundingClientRect(), bounds = scroller.getBoundingClientRect();
            const scale = bounds.height / scroller.offsetHeight || 1;
            if (rect.top < bounds.top + 8) scroller.scrollTop += (rect.top - bounds.top) / scale - 8;
            else if (rect.bottom > bounds.bottom - 8) scroller.scrollTop += (rect.bottom - bounds.bottom) / scale + 8;
        }
    }
}
