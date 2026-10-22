const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/dialogue-ui-kit-v1', process.argv[2] ? 'game-validation-local' : 'game-validation');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [], missing = [], loadFailures = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', r => { if (r.status() >= 400 && /dialogue-v1/.test(r.url())) missing.push(r.url()); });
        page.on('response', r => { if (r.status() >= 400 && /\.(js|css|glb)(\?|$)/.test(r.url())) loadFailures.push(r.url()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.status.hidden, null, { timeout: 30000 })
            .catch(error => { throw Error(`${error.message}\n${JSON.stringify({ errors, loadFailures })}`); });
        const start = page.getByRole('button', { name: '게임 시작', exact: true });
        if (await start.isVisible()) await start.click();
        for (let i = 0; i < 3; i++) {
            const skip = page.getByRole('button', { name: /건너뛰기/ }).first();
            if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(150); }
        }
        // Exercise the real component instances, not re-created HTML fixtures.
        await page.evaluate(() => window.stockWarsApp.annaDialogueModal.show('새 대사창을 확인해요.'));
        await page.waitForTimeout(400);
        const anna = page.locator('#annaDialogueModalOverlay .crayon-dialogue');
        assert.equal(await anna.isVisible(), true);
        assert.equal(await anna.locator('[role=img], img, .vn-portrait-frame').count(), 0);
        assert.equal(await anna.evaluate(el => getComputedStyle(el).color), 'rgb(76, 43, 26)');
        const checkChoices = async (panel, choices) => {
            const a = await panel.boundingBox(), b = await choices.boundingBox();
            assert.ok(b.y + b.height <= a.y - 2, `Choices must be above panel: ${JSON.stringify({a,b})}`);
            assert.ok(Math.abs(b.x + b.width - (a.x + a.width)) < 25, 'Choices must align with panel right edge');
            const viewport = page.viewportSize();
            assert.ok(b.y >= 0 && b.x >= 0 && b.x + b.width <= viewport.width + 1, 'Choices must remain on screen');
        };
        await checkChoices(anna, page.locator('#annaVnOptions'));
        await page.screenshot({ path: path.join(output, 'moa-desktop.png') });
        await page.locator('#annaVnOptions [data-action=chat]').click();
        assert.notEqual(await page.locator('#annaSpeechText').textContent(), '"새 대사창을 확인해요."');
        await page.locator('#btnCloseAnnaVn').click();
        assert.equal(await anna.isVisible(), false);

        const themes = await page.evaluate(async () => {
            const { DIALOGUE_THEMES } = await import('/js/data/dialogueThemes.js');
            const { applyDialogueTheme } = await import('/js/components/dialogue/dialogueTheme.js');
            const host = document.createElement('section'); host.id = 'theme-check';
            host.style.cssText = 'position:fixed;inset:20px;z-index:20000;overflow:auto;background:#d8c9b1;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px';
            document.body.append(host);
            const result = [];
            for (const [id, theme] of Object.entries(DIALOGUE_THEMES)) {
                const card = document.createElement('div');
                applyDialogueTheme(card, id);
                card.innerHTML = `<strong class="crayon-nameplate">${theme.name}</strong><p>오늘도 반가워요.</p><button>이야기하기</button>`;
                host.append(card);
                const files = ['dialogue-panel', 'nameplate', 'choice-selected', 'next-arrow'].map(f => `/assets/ui/dialogue-v1/${id}/${f}.png`);
                for (const src of files) {
                    const image = new Image(); image.src = src; await image.decode();
                    if (!image.naturalWidth) throw Error(src);
                }
                result.push({ id, accent: card.style.getPropertyValue('--dialogue-accent') });
            }
            return result;
        });
        assert.equal(new Set(themes.map(t => t.accent)).size, 10);
        await page.screenshot({ path: path.join(output, 'all-themes.png') });
        await page.evaluate(() => document.getElementById('theme-check').remove());

        // Tutorial speaker changes must switch the actual panel and button assets.
        await page.evaluate(() => {
            const tutorial = window.stockWarsApp.annaTutorial;
            tutorial.isActive = true;
            tutorial.steps = [{ id: 'ui_check', speaker: '봉봉', text: '주문을 함께 확인할까요?', tracker: '확인' }];
            tutorial.currentStepIdx = 0; tutorial.overlay.classList.remove('hidden');
            tutorial.renderDialogue(tutorial.steps[0]);
        });
        assert.equal(await page.locator('#vnDialogueBox').getAttribute('data-dialogue-theme'), 'bongbong');
        assert.equal(await page.locator('#vnDialogueBox img, #vnPortraitFrame').count(), 0);
        await page.evaluate(() => {
            const t = window.stockWarsApp.annaTutorial;
            t.steps[0].choices = [{ label: '주문을 확인할게요', feedback: '좋아요.' }, { label: '다시 설명해 주세요', feedback: '함께 볼까요?' }];
            t.renderDialogue(t.steps[0]);
        });
        await checkChoices(page.locator('#vnDialogueBox'), page.locator('.vn-rumor-choices'));
        await page.screenshot({ path: path.join(output, 'tutorial.png') });
        await page.evaluate(() => {
            const t = window.stockWarsApp.annaTutorial;
            clearInterval(t.typewriterTimer); t.isActive = false; t.overlay.classList.add('hidden');
        });

        // Enter the current 3D lobby and talk from the reachable front of its desk.
        await page.keyboard.press('l');
        await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene?.active);
        await page.evaluate(async () => {
            const scene = window.stockWarsApp.cipherLobbyScene;
            await scene.ready;
            const { GROUND_PROJECTION } = await import('/js/data/townModelBuildings.js');
            scene.controller.charPosX = 0;
            scene.controller.charPosY = 40 * GROUND_PROJECTION;
        });
        await page.keyboard.press('f');
        const tori = page.locator('.cipher-notice.crayon-dialogue');
        await tori.waitFor({ state: 'visible' });
        assert.equal(await tori.isVisible(), true);
        assert.equal(await tori.getAttribute('data-dialogue-theme'), 'tori');
        assert.equal(await tori.locator('img').count(), 0);
        await checkChoices(tori, tori.locator('.cipher-agent-actions'));
        await tori.getByRole('button', { name: '궁금한 게 있어요', exact: true }).click();
        await tori.getByRole('button', { name: '거래 수수료', exact: true }).click();
        assert.match(await tori.locator('.cipher-dialogue-text').textContent(), /수수료/);
        await page.screenshot({ path: path.join(output, 'tori-desktop.png') });
        await tori.getByRole('button', { name: '대화 마치기', exact: true }).click();
        assert.equal(await tori.count(), 0);
        assert.equal(await page.locator('.model-dialogue-overlay').isVisible(), false);
        // Reopen with F and dismiss with Escape, preserving the current room.
        await page.keyboard.press('f');
        await tori.waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.model-dialogue-overlay').isVisible(), false);
        await page.evaluate(() => window.stockWarsApp.cipherLobbyScene.hide());

        await page.evaluate(async () => {
            const { openVivianCounterShop } = await import('/js/app/VivianCounterShop.js');
            openVivianCounterShop(window.stockWarsApp);
        });
        const bongbong = page.locator('.vivian-npc-panel.crayon-dialogue');
        assert.equal(await bongbong.isVisible(), true);
        assert.equal(await bongbong.locator('img, #vivianPortraitViewport').count(), 0);
        assert.equal(await bongbong.getAttribute('data-dialogue-theme'), 'bongbong');
        await checkChoices(bongbong, bongbong.locator('.vivian-npc-actions'));
        await page.screenshot({ path: path.join(output, 'bongbong-shop.png') });
        await page.evaluate(() => window.stockWarsApp.vivianStoreModal.close());

        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => window.stockWarsApp.annaDialogueModal.show('작은 화면에서도 대사를 읽을 수 있어요.'));
        await page.waitForTimeout(400);
        const bounds = await anna.boundingBox();
        assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= 391, JSON.stringify(bounds));
        assert.ok(bounds.y >= -1 && bounds.y + bounds.height <= 845, JSON.stringify(bounds));
        await checkChoices(anna, page.locator('#annaVnOptions'));
        const textHeight = await page.locator('#annaSpeechText').evaluate(el => {
            const range = document.createRange(); range.selectNodeContents(el);
            return range.getBoundingClientRect().height;
        });
        assert.ok(textHeight >= 17, `Mobile text is too small: ${textHeight}`);
        await page.screenshot({ path: path.join(output, 'moa-mobile.png') });
        assert.deepEqual(missing, []);
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ root, themes, errors, missing, mobileBounds: bounds, status: 'passed' }, null, 2));
        console.log('Dialogue runtime checks passed: 10 themes / 40 assets, portrait removal, conversation callbacks, tutorial theme switching, desktop and mobile.');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
