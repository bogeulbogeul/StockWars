const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../web');
const server = http.createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const base = `http://127.0.0.1:${server.address().port}`;
    await page.route('**/harness.html', route => route.fulfill({ contentType: 'text/html', body: '<html><link rel="stylesheet" href="/css/modules/demo-end.css"><style>.hidden{display:none}</style><div id="app"></div></html>' }));
    await page.goto(base + '/harness.html');
    await page.addStyleTag({ url: base + '/css/modules/diary.css' });
    await page.evaluate(async () => {
      const { DiaryModal } = await import('/js/components/DiaryModal.js');
      window.diaryApp = { userProfile: { diaryReceived: true }, itemGameplay: { save: () => false } };
      window.diary = new DiaryModal(diaryApp);
      diary.open();
    });
    await page.click('[data-diary-quit]');
    assert.match(await page.locator('[data-diary-status]').textContent(), /저장하지 못했어요/);
    await page.evaluate(() => { diaryApp.itemGameplay.save = () => true; });
    await page.click('[data-diary-save]');
    assert.match(await page.locator('[data-diary-status]').textContent(), /저장했어요/);
    await page.screenshot({ path: path.join(__dirname, 'diary-save.png') });
    await page.click('[data-diary-close]');
    await page.evaluate(async () => {
      const { SettlementModal } = await import('/js/components/SettlementModal.js');
      const { finishDemo } = await import('/js/app/DemoLifecycle.js');
      window.report = new SettlementModal(document.querySelector('#app'), { onClose: final => { if(final) void finishDemo({ appContainer: document.querySelector('#app') }); } });
      window.state = { day: 6, maxDays: 7, cash: 3000, targetRent: 2000, portfolioValue: 0, totalNetWorth: 3000 };
      report.open(state);
      localStorage.setItem('stockwars-item-gameplay-v1', 'old');
      localStorage.setItem('other-app', 'keep');
    });
    await page.click('#btnCloseSettlement');
    assert.ok(page.url().endsWith('harness.html'));
    for (const rentPaid of [true, false]) {
      await page.evaluate(paid => report.open({ ...state, day: 7, rentPaid: paid }), rentPaid);
      await page.locator('#settlementModal').evaluate(el => el.click());
      assert.equal(await page.locator('#btnCloseSettlement').isVisible(), true);
    }
    await page.click('#btnCloseSettlement');
    await page.waitForURL('**/demo-end.html');
    await page.waitForFunction(() => !document.querySelector('[data-restart]').disabled);
    assert.deepEqual(await page.evaluate(() => [localStorage.getItem('stockwars-item-gameplay-v1'), localStorage.getItem('other-app')]), [null, 'keep']);
    await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished)));
    await page.screenshot({ path: path.join(__dirname, 'demo-end-desktop.png') });
    await page.setViewportSize({ width: 390, height: 740 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(__dirname, 'demo-end-mobile.png') });
    await page.route('**/index.html', route => route.fulfill({ contentType: 'text/html', body: '<h1>Fresh title</h1>' }));
    await page.click('[data-restart]');
    await page.waitForURL('**/index.html');
    assert.equal(await page.evaluate(() => localStorage.getItem('stockwars-demo-ended-v1')), null);
    await page.addInitScript(() => {
      window.calls = { discard: 0, restart: 0, quit: 0 };
      window.stockWarsDesktop = {
        discardDemoRecords: async () => ++calls.discard === 1 ? { error: '테스트 연결 실패' } : { success: true },
        restartDemo: async () => { calls.restart++; return { success: true }; },
        quit: async () => { calls.quit++; return { success: true }; }
      };
    });
    await page.goto(base + '/demo-end.html');
    await page.waitForSelector('[data-retry]:not([hidden])');
    assert.equal(await page.locator('[data-restart]').isDisabled(), true);
    await page.click('[data-retry]');
    await page.waitForFunction(() => !document.querySelector('[data-restart]').disabled);
    await page.click('[data-restart]');
    await page.click('[data-quit]');
    assert.deepEqual(await page.evaluate(() => calls), { discard: 2, restart: 1, quit: 1 });
    assert.deepEqual(errors, []);
    console.log('PASS: settlement, fade navigation, cleanup, restart, retry, quit, responsive layout; no page errors');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
