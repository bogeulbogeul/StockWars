import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnnaScenario } from '../js/components/tutorial/annaTutorialScenario.js';
import { ParkLogisticsTutorial } from '../js/components/ParkLogisticsTutorial.js';
import { describeTutorialStep, tutorialShortcutDestination } from '../js/components/tutorial/tutorialPresentation.js';

test('short lessons preserve manual actions and provide optional order caveats', () => {
    const steps = buildAnnaScenario({});
    for (const step of steps) assert.ok(step.text.length <= 100, `${step.id}: ${step.text.length} characters`);
    assert.equal(new Set(steps.map(step => step.id)).size, steps.length);
    for (const id of ['open_phone', 'select_stock', 'buy_stock', 'portfolio_guide', 'enter_logistics', 'rumor_inventory_guide']) {
        const step = steps.find(step => step.id === id);
        assert.equal(step.requiresManualAction, true);assert.ok(step.targetSelector);
    }
    assert.match(steps.find(step => step.id === 'market_order_guide').detailText, /±5%/);
    assert.match(steps.find(step => step.id === 'limit_order_guide').detailText, /부족/);
    assert.deepEqual(steps.find(step => step.id === 'stock_profit_example').cards.map(card => card[1]), ['+50G', '−50G']);
    assert.match(steps.find(step => step.id === 'stock_profit_fees').cards[0][1], /수수료/);
    assert.equal(steps.find(step => step.id === 'welcome_2').cards[0][0], '+5,000G');
    assert.equal(steps.find(step => step.id === 'logistics_completed').cards[0][0], '+2,000G');
    const price = steps.find(step => step.id === 'stock_basics_price');
    assert.equal(price.example.rows[0], '주식 1주 = 400G');
    assert.equal(price.cards, undefined);
    const earnings = steps.find(step => step.id === 'stock_price_earnings');
    assert.equal(earnings.example.flow, true);
    assert.match(earnings.example.rows[1], /사려는 사람/);
    assert.ok(steps.findIndex(step => step.id === 'stock_price_expectations') > steps.indexOf(earnings));
});

test('every lesson supplies a goal, example or highlighted app, and next action', () => {
    const steps = [...buildAnnaScenario({}), ...ParkLogisticsTutorial.prototype.buildScenario('신입')];
    for (const step of steps.map(describeTutorialStep)) {
        assert.ok(step.lessonTitle, step.id);
        assert.ok(step.example?.rows.length || step.appIntroTarget || step.htsIntroTarget || step.chartIntroTarget || step.screenOverview, step.id);
        assert.ok(step.nextAction, step.id);
    }
    assert.match(describeTutorialStep(steps.find(step => step.id === 'buy_stock')).nextAction, /매수/);
    assert.match(describeTutorialStep(steps.find(step => step.id === 'practice_deliver_3')).nextAction, /내려놓으면/);
});

test('logistics practice keeps action gates and visible stabilization thresholds', () => {
    const steps = ParkLogisticsTutorial.prototype.buildScenario('신입');
    assert.equal(steps.filter(step => step.practice === 'pickup').length, 4);
    assert.equal(steps.filter(step => step.practice === 'deliver').length, 4);
    for (const step of steps) assert.ok(step.text.length < 80);
    for (const step of steps.filter(step => step.practice === 'deliver' && step.count >= 3)) {
        assert.ok(step.cards.some(card => card[0] === '게이지 70%'));
        assert.ok(step.cards.some(card => card[0] === '30% 아래'));
        assert.equal(step.targetSelector, '#logisticsTruckZone');
    }
});

test('shortcuts lead to lesson destinations without executing trades or rewards', () => {
    assert.equal(tutorialShortcutDestination('celebrate'), null);
    assert.equal(tutorialShortcutDestination('portfolio_guide'), null);
    assert.equal(tutorialShortcutDestination('news_tab_guide'), null);
    assert.equal(tutorialShortcutDestination('news_reading_guide'), null);
    assert.equal(tutorialShortcutDestination('rumor_inventory_guide'), null);
    for (const id of ['buy_stock', 'first_sell_guide', 'logistics_completed']) assert.equal(tutorialShortcutDestination(id), null);
});

test('stock selection requires clicking the recommended row without a dialogue shortcut', () => {
    assert.equal(tutorialShortcutDestination('select_stock'), null);
    const step = buildAnnaScenario({ stockId: 'TEST' }).find(step => step.id === 'select_stock');
    assert.equal(step.requiresManualAction, true);
    assert.ok(step.targetSelector.includes('stock-item-row'));
});

test('phone app tour introduces all five apps before requiring the stock app to open', () => {
    const steps = buildAnnaScenario({});
    const start = steps.findIndex(step => step.id === 'open_phone') + 1;
    const tour = steps.slice(start, start + 5);
    assert.deepEqual(tour.map(step => step.appIntroTarget), ['#iconStockApp', '#iconBubbleApp', '#iconMemoApp', '#iconAchieveApp', '#iconSettingsApp']);
    assert.ok(tour.every(step => step.requiresManualAction === false && !step.actionBtnText && !step.targetSelector));
    assert.ok(tour.every(step => describeTutorialStep(step).text === step.text));
    assert.match(tour[2].text, /준비 중/);
    assert.match(tour[4].text, /버전 안내/);
    assert.equal(steps[start + 5].id, 'launch_stock_app');
    assert.equal(steps[start + 5].requiresManualAction, true);
});

test('HTS home explains each region before asking for a direct market-tab click', () => {
    const steps = buildAnnaScenario({});
    const overviewIndex = steps.findIndex(step => step.id === 'launch_stock_app') + 1;
    assert.equal(steps[overviewIndex].id, 'hts_home_overview');
    assert.equal(steps[overviewIndex].screenOverview, true);
    assert.equal(steps[overviewIndex].requiresManualAction, false);
    assert.equal(steps[overviewIndex].htsIntroTarget, undefined);
    const start = overviewIndex + 1;
    const tour = steps.slice(start, start + 7);
    assert.ok(tour.every(step => step.htsIntroTarget && !step.requiresManualAction && !step.actionBtnText));
    assert.equal(new Set(tour.map(step => step.htsIntroTarget)).size, 7);
    assert.ok(tour.some(step => step.htsIntroTarget === '#summaryCard'));
    assert.ok(tour.some(step => step.htsIntroTarget === '#recentStocksGrid'));
    assert.ok(tour.every(step => describeTutorialStep(step).text === step.text));
    assert.equal(steps[start + 7].id, 'market_tab');
    assert.equal(steps[start + 7].requiresManualAction, true);
});


test('expanded chart tour requires opening and closing the chart around four focused lessons', () => {
    const steps = buildAnnaScenario({});
    const start = steps.findIndex(step => step.id === 'chart_detail');
    assert.equal(steps[start].requiresManualAction, true);
    assert.equal(steps[start].targetSelector, '#btnExpandChart');
    const tour = steps.slice(start + 1, start + 6);
    assert.deepEqual(tour.map(step => step.id), ['chart_tour_price', 'chart_tour_metrics', 'chart_tour_graph', 'chart_tour_period', 'chart_tour_close']);
    assert.ok(tour.every(step => step.chartIntroTarget));
    assert.equal(tour[2].allowedSelector, '#detailedChartScrollWrapper');
    assert.equal(tour[3].allowedSelector, '#timeframeSelector');
    assert.equal(tour[4].requiresManualAction, true);
    const order = steps.findIndex(step => step.id === 'open_order_screen');
    assert.ok(order > start + 6);
    assert.equal(steps[order].id, 'open_order_screen');
    assert.equal(steps[order].targetSelector, '#btnSubtabOrder');
    assert.equal(steps[order].requiresManualAction, true);
    assert.equal(steps[order + 1].id, 'order_screen_overview');
    assert.equal(steps[order + 1].screenOverview, true);
    assert.equal(steps[order + 2].id, 'market_order_guide');
});


test('account opens with an unfaded overview before the profit explanation', () => {
    const steps = buildAnnaScenario({});
    const index = steps.findIndex(step => step.id === 'portfolio_guide');
    const overview = steps[index + 1];
    assert.equal(overview.id, 'portfolio_overview');
    assert.equal(overview.screenOverview, true);
    assert.equal(overview.requiresManualAction, false);
    assert.equal(overview.htsIntroTarget, undefined);
    assert.equal(tutorialShortcutDestination(overview.id), null);
    assert.equal(steps[index + 2].id, 'sector_allocation_guide');
    assert.equal(steps[index + 3].id, 'social_and_ranking_guide');
});
