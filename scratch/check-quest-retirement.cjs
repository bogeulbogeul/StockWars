const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../web');
const server = http.createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'text/html');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const base = `http://127.0.0.1:${server.address().port}`;
    await page.route('**/harness.html', route => route.fulfill({ contentType: 'text/html', body: '<html lang="ko"><link rel="stylesheet" href="/css/style.css"><div id="app"></div></html>' }));
    await page.goto(base + '/harness.html');
    await page.evaluate(async () => {
      const { SmartphoneUI } = await import('/js/components/SmartphoneUI.js');
      const { RentQuestTracker } = await import('/js/components/RentQuestTracker.js');
      const { PlayerProfileModal } = await import('/js/components/PlayerProfileModal.js');
      const { AnnaDialogueModal } = await import('/js/components/AnnaDialogueModal.js');
      const container = document.querySelector('#app');
      window.phone = new SmartphoneUI(container);
      phone.showHomeScreen();
      window.rent = new RentQuestTracker(container);
      rent.update({ cash: 1000, targetRent: 2000, day: 2, maxDays: 7 }, true);
      window.profile = new PlayerProfileModal(container, {
        getProfile: () => ({ nickname: '검수', trait: { title: '분석가' } }),
        getTitles: () => { throw Error('Retired title source was read'); }
      });
      const fail = () => { throw Error('Retired quest callback was called'); };
      window.anna = new AnnaDialogueModal(container, { getQuestReward: fail, onClaimReward: fail, getQuestOffers: fail });
      anna.show(); anna.hide();
    });
    assert.equal(await page.locator('#iconAchieveApp, #achievementApp, .quest-tabs, .side-quest-list, #annaQuestOffers').count(), 0);
    assert.equal(await page.locator('.app-icon-item').count(), 4);
    assert.equal(await page.locator('.rent-quest progress').evaluate(el => el.value), 50);
    await page.locator('.rent-quest-toggle').click();
    assert.equal(await page.locator('#rentQuestDetails').isVisible(), false);
    await page.locator('.rent-quest-toggle').click();
    assert.equal(await page.locator('#rentQuestDetails').isVisible(), true);
    await page.evaluate(() => { phone.showStockApp(); phone.showHomeScreen(); profile.open(); });
    assert.equal(await page.locator('[data-field="equippedTitle"]').count(), 0);
    assert.equal(await page.locator('[data-field="nickname"]').innerText(), '검수');
    await page.evaluate(() => profile.close());
    assert.deepEqual(errors, []);
    console.log('PASS: phone navigation, monthly rent progress/collapse, NPC callbacks and profile without quests/titles');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
