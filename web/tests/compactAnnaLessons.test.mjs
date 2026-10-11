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

test('every onboarding and logistics step supplies a goal, concrete example and next action', () => {
    const steps = [...buildAnnaScenario({}), ...ParkLogisticsTutorial.prototype.buildScenario('신입')];
    for (const step of steps.map(describeTutorialStep)) {
        assert.ok(step.lessonTitle, step.id);
        assert.ok(step.example?.rows.length, step.id);
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
    assert.equal(tutorialShortcutDestination('celebrate').tab, 'Profile');
    assert.equal(tutorialShortcutDestination('portfolio_guide').tab, 'Profile');
    assert.equal(tutorialShortcutDestination('news_tab_guide').tab, 'News');
    assert.equal(tutorialShortcutDestination('rumor_inventory_guide').selector, '#btnHudInventory');
    for (const id of ['buy_stock', 'first_sell_guide', 'logistics_completed']) assert.equal(tutorialShortcutDestination(id), null);
});

test('stock selection shortcut opens the current recommended stock, not just its list', () => {
    assert.deepEqual(tutorialShortcutDestination('select_stock'), {
        label: '추천 종목 보기 →', tab: 'Market', openRecommendedStock: true
    });
    assert.equal(tutorialShortcutDestination('market_tab').openRecommendedStock, undefined);
});
