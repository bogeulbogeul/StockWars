const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve('web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.txt': 'text/plain', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const missing = []; page.on('response', response => {
        if (response.status() >= 400 && response.url().startsWith('http://127.0.0.1')) missing.push(response.url());
    });
    const url = `http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`;
    const ready = () => page.waitForFunction(() => window.stockWarsExhibition?.started && !window.stockWarsExhibition.busy);
    try {
        await page.goto(url.replace('&skipOpening=1', ''));
        await page.getByRole('button', {name:'게임 시작',exact:true}).click();
        await page.waitForSelector('.bus-arrival');
        assert.equal(await page.locator('.opening-sequence iframe').count(), 0);
        await page.locator('.opening-sequence__skip').click(); await ready();
        for (const order of ['packing', 'stock']) {
            await page.goto(url); await ready();
            if (order === 'stock') await page.evaluate(() => window.stockWarsExhibition.restart());
            await ready();
            await page.evaluate(() => localStorage.setItem('stockwars.existing-test-save', 'preserved'));
            let reloaded = false;
            for (let guard = 0; guard < 500; guard++) {
                await ready();
                const info = await page.evaluate(() => {
                    const app = window.stockWarsExhibition;
                    return { beat: app.plan[app.state.cursor], cursor: app.state.cursor, flags: app.state.flags, ended: app.view.root.dataset.ended };
                });
                if (info.ended) break;
                if (await page.evaluate(() => window.stockWarsExhibition.arrival.active)) {
                    await page.keyboard.press('f');
                    assert.equal(await page.evaluate(() => window.stockWarsExhibition.state.moaCalls || 0), 0);
                    await page.keyboard.down('a');
                    await page.waitForFunction(() => window.stockWarsExhibition.arrival.near());
                    await page.keyboard.up('a');
                    await page.keyboard.down('f');
                    await page.keyboard.down('f');
                    assert.equal(await page.evaluate(() => window.stockWarsExhibition.state.moaCalls), 1);
                    await page.keyboard.up('f');
                    await page.reload(); await ready();
                    assert.equal(await page.evaluate(() => window.stockWarsExhibition.state.moaCalls), 1);
                    await page.keyboard.press('f');
                    assert.equal(await page.evaluate(() => window.stockWarsExhibition.state.moaCalls), 2);
                    assert.equal(await page.evaluate(() => !!window.stockWarsExhibition.state.flags.moaAwake), false);
                    await page.screenshot({path:`scratch/exhibition-${order}-sleep-talk.png`});
                    await page.keyboard.press('f'); await ready();
                    assert.equal(await page.evaluate(() => window.stockWarsExhibition.state.flags.moaAwake), true);
                    continue;
                }
                const { beat } = info;
                if (beat.kind === 'line') {
                    await page.evaluate(() => document.querySelector('.exhibition-panel button').click()); continue;
                }
                console.log(order, beat.id);
                if (beat.id === 'nickname') {
                    assert.equal(await page.locator('.exhibition-phone').isVisible(), false);
                    await page.getByLabel('신청인 이름').fill('전시요정');
                    await page.getByText('신청서 제출', { exact: true }).click();
                } else if (beat.id === 'order') {
                    if(order === 'packing') await page.screenshot({path:'scratch/exhibition-activity-choice.png'});
                    await page.getByText(order === 'packing' ? '주민 부탁 들어주기' : '주식 투자 배우기', { exact: true }).click();
                } else if (beat.id === 'openPhone') {
                    assert.equal(await page.locator('.exhibition-wallet').isVisible(), false);
                    await page.getByText('휴대폰 열기', { exact: true }).click();
                    assert.equal(await page.getByText('잎새 주식앱', { exact: true }).count(), 0);
                    await page.locator('.exhibition-phone-dialog button').click();
                } else if (beat.id === 'certificate') {
                    assert.equal(await page.locator('.exhibition-assets').isVisible(), false);
                    for (const answer of [2, 1, 3]) {
                        await page.locator('.exhibition-choices button').nth(answer).click();
                        await page.locator('.exhibition-choices button').click();
                    }
                    await page.getByText('자격증 받기', { exact: true }).click();
                } else if (beat.id === 'trade') {
                    await page.locator('.exhibition-stock button').first().click();
                    await page.getByText('1주 매수', { exact: true }).click();
                } else if (beat.id === 'packing') {
                    await page.getByText('포장하기', { exact: true }).click();
                    await page.evaluate(async () => {
                        const { PACKING_PATTERNS } = await import('/js/components/packing/PackingData.js');
                        const { placeItem } = await import('/js/components/packing/PackingLogic.js');
                        const game = window.stockWarsExhibition.activities.game;
                        for (let n = 0; n < 5; n++) {
                            const rows = PACKING_PATTERNS[game.order.patternIndex];
                            for (const item of game.order.items) {
                                const y = rows.findIndex(row => row.includes(item.id));
                                if (!placeItem(game.order, item, rows[y].indexOf(item.id), y)) throw Error('placement failed');
                            }
                            game.render(); game.dialog.querySelector('[data-action="finish"]').click();
                            if (n < 4) game.dialog.querySelector('[data-action="next"]').click();
                        }
                        game.close();
                    });
                } else if (beat.id === 'asleep') {
                    await page.getByText('조금 더 있다가', { exact: true }).click();
                    await page.getByText('이제 쉬기', { exact: true }).click();
                } else {
                    await page.evaluate(() => document.querySelector('.exhibition-choices button').click());
                }
                if (beat.id === 'loan' && !reloaded) {
                    await ready(); const cash = await page.evaluate(() => window.stockWarsExhibition.state.cash);
                    await page.reload(); await ready();
                    await page.getByText('이어서 하기', { exact: true }).click(); await ready();
                    assert.equal(await page.evaluate(() => window.stockWarsExhibition.state.cash), cash);
                    reloaded = true;
                }
                await page.waitForFunction(cursor => {
                    const app = window.stockWarsExhibition;
                    return app.state.cursor !== cursor || app.state.flags.asleep;
                }, info.cursor);
            }
            await ready();
            const result = await page.evaluate(() => ({ state: window.stockWarsExhibition.state,
                ended: window.stockWarsExhibition.view.root.dataset.ended, legacy: localStorage.getItem('stockwars.existing-test-save') }));
            assert.equal(result.ended, 'true'); assert.equal(result.state.flags.asleep, true);
            assert.equal(result.state.trades.length, 1); assert.equal(result.state.analysis, 3);
            assert.equal(result.legacy, 'preserved');
            await page.screenshot({ path: `scratch/exhibition-${order}-ending.png` });
            console.log(`${order} first: completed ${result.state.cursor} beats; cash ${result.state.cash}; resumed without duplicate loan`);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByText('다음 방문자 · 처음부터', { exact: true }).click(); await ready();
        await page.screenshot({ path: 'scratch/exhibition-mobile.png' });
        assert.equal(await page.locator('.exhibition-phone').isVisible(), false);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.ok(await page.locator('.exhibition-text').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)) >= 16);
        assert.deepEqual(errors, []); assert.deepEqual(missing, []); console.log('Mobile reset, asset requests and runtime errors: PASS');
    } catch (error) {
        console.log('Failure state:', await page.evaluate(() => ({ state: window.stockWarsExhibition?.state,
            panel: document.querySelector('.exhibition-panel')?.textContent })).catch(() => null));
        await page.screenshot({path:'scratch/exhibition-failure.png'}).catch(() => {});
        console.log('Page errors:', errors); throw error;
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
