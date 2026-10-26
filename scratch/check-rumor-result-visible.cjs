const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/rumor-result-visible-2026-10-25');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__quiz-check') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end('<!doctype html><html><head><link rel=stylesheet href=/css/style.css></head><body style="--game-vw:1vw;--game-vh:1vh"><div id=quizHost></div></body></html>');
    }
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.txt': 'text/plain; charset=utf-8' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
async function mount(page) {
    await page.evaluate(async () => {
        const { AUTHORED_RUMOR_ITEMS } = await import('/js/data/rumorCatalog.js');
        const { ItemEngine } = await import('/js/engine/ItemEngine.js');
        const { RumorPopup } = await import('/js/components/inventory/RumorPopup.js');
        const { buildInterpretationQuestion } = await import('/js/engine/RumorQuizQuestions.js');
        const saved = JSON.parse(localStorage.getItem('quiz-browser-test') || 'null');
        const engine = new ItemEngine({ state: saved, clock: () => 1000, blackSwanEnabled: false });
        if (!saved) {
            engine.state.inventory = AUTHORED_RUMOR_ITEMS.slice(0, 20).map((item, index) => ({ ...structuredClone(item), id: `sample-${index}`, isRead: false }));
            engine.state.inventory.push({ ...structuredClone(engine.state.inventory[0]), id: 'copy', interpretationLevel: 5 });
        }
        const persist = () => localStorage.setItem('quiz-browser-test', JSON.stringify(engine.state));
        const popup = new RumorPopup(document.getElementById('quizHost'), {
            getAnalysisLevel: () => engine.stats().analysis,
            getAnalysisProgress: () => engine.analysisProgress(),
            beginRumorQuiz: id => { const r = engine.beginRumorQuiz(id); persist(); return r; },
            submitRumorQuiz: (id, key, choice) => { const r = engine.submitRumorQuiz(id, key, choice); persist(); return r; }
        });
        window.quizTest = {
            engine, popup,
            open(id) { popup.open(engine.state.inventory.find(item => item.id === id), persist); },
            answer() { const q = popup.quizCard.quiz; const item = popup.currentItem; return buildInterpretationQuestion(item.rumorId, q.level, q.text).correctIndex; }
        };
        window.quizTest.open('sample-0');
    });
}
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => { if (response.status() >= 400 && /\.(js|css)(?:\?|$)/.test(response.url())) errors.push(response.status() + ' ' + response.url()); });
        const base = `http://127.0.0.1:${server.address().port}`;
        await page.goto(base, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.stockWarsExhibition || window.stockWarsApp, null, { timeout: 30000 }).catch(error => { throw new Error(error.message + '\n' + errors.join('\n')); });
        await page.goto(base + '/__quiz-check', { waitUntil: 'load' });
        await mount(page);
        assert.equal(await page.locator('.rumor-tags, .rumor-stock-highlight, .rumor-reliability-note, .rumor-effects-box, .rumor-value-status-box').count(), 0);
        const appearance = await page.evaluate(async () => {
            const { getItemArtwork } = await import('/js/data/itemArtwork.js');
            const art = document.querySelector('.rumor-envelope-art');
            await art.decode();
            return { actual: art.getAttribute('src'), expected: getItemArtwork('item_premium_rumor'),
                header: getComputedStyle(document.querySelector('.rumor-header')).backgroundColor,
                action: getComputedStyle(document.querySelector('.rumor-confirm-btn')).backgroundColor };
        });
        assert.equal(appearance.actual, appearance.expected);
        assert.equal(appearance.actual, 'assets/items/paper-v4/sealed-news.svg');
        assert.equal(appearance.header, 'rgb(76, 98, 55)');
        assert.equal(appearance.action, 'rgb(101, 127, 67)');
        await page.screenshot({ path: path.join(output, prefix + '-reading.png') });
        await page.locator('.rumor-quiz-start').click();
        await page.screenshot({ path: path.join(output, prefix + '-quiz-open.png') });
        // Verify actual UI text at every band boundary before testing rewards.
        const shownQuestions = [];
        for (const level of [1, 2, 3, 4, 5]) {
            const expected = await page.evaluate(async level => {
                const { AUTHORED_RUMOR_QUIZZES: bank } = await import('/js/data/authoredRumorQuizzes.js');
                const test = window.quizTest;
                const item = test.engine.state.inventory.find(item => item.id === 'sample-0');
                item.interpretationLevel = level;
                test.open(item.id); test.popup.quizCard.open();
                const entry = bank.find(q => q.eventId === item.rumorId
                    && q.minLevel === level);
                return { question: entry.question, choices: entry.choices };
            }, level);
            assert.equal(await page.locator('.rumor-quiz-question').textContent(), expected.question);
            assert.deepEqual(await page.locator('.rumor-quiz-choice').allTextContents(), expected.choices);
            assert.equal(await page.locator('.rumor-quiz-question').count(), 1);
            shownQuestions.push(expected.question);
        }
        assert.equal(new Set(shownQuestions).size, 5);
        await page.screenshot({ path: path.join(output, prefix + '-authored-high.png') });
        await page.evaluate(() => {
            const test = window.quizTest;
            test.engine.state.inventory.find(item => item.id === 'sample-0').interpretationLevel = 1;
            test.open('sample-0');
        });
        await page.getByRole('button', { name: '퀴즈 풀기', exact: true }).click();
        assert.equal(await page.locator('.rumor-quiz-stamp').isVisible(), false);
        let correct = await page.evaluate(() => window.quizTest.answer());
        await page.locator('.rumor-quiz-choice').nth((correct + 1) % 3).click();
        assert.match(await page.locator('.rumor-quiz-feedback').textContent(), /괜찮아요/);
        assert.equal(await page.evaluate(() => window.quizTest.engine.analysisProgress().current), 0);
        await page.screenshot({ path: path.join(output, prefix + '-wrong.png') });
        assert.equal(await page.locator('.rumor-quiz-stamp').isVisible(), false);
        await page.reload({ waitUntil: 'load' }); await mount(page);
        await page.getByRole('button', { name: '퀴즈 풀기', exact: true }).click();
        correct = await page.evaluate(() => window.quizTest.answer());
        await page.locator('.rumor-quiz-choice').nth(correct).click();
        assert.match(await page.locator('.rumor-quiz-feedback').textContent(), /숙련도 \+1/);
        assert.equal(await page.evaluate(() => window.quizTest.engine.analysisProgress().current), 1);
        assert.ok(await page.locator('.rumor-quiz-choice').nth(correct).isDisabled());
        assert.equal(await page.locator('.rumor-quiz-stamp').isVisible(), true);
        await page.waitForTimeout(400);
        assert.equal(await page.evaluate(() => document.querySelector('.rumor-quiz-feedback').getBoundingClientRect().bottom <= document.querySelector('.rumor-footer').getBoundingClientRect().top), true);
        await page.screenshot({ path: path.join(output, prefix + '-correct-stamp.png') });
        await page.reload({ waitUntil: 'load' }); await mount(page);
        await page.evaluate(() => window.quizTest.open('copy'));
        await page.getByRole('button', { name: '퀴즈 풀기', exact: true }).click();
        correct = await page.evaluate(() => window.quizTest.answer());
        await page.locator('.rumor-quiz-choice').nth(correct).click();
        assert.match(await page.locator('.rumor-quiz-feedback').textContent(), /추가 보상은 없어요/);
        assert.equal(await page.evaluate(() => window.quizTest.engine.analysisProgress().current), 1);
        for (let index = 1; index < 20; index++) {
            await page.evaluate(id => window.quizTest.open(id), `sample-${index}`);
            await page.getByRole('button', { name: '퀴즈 풀기', exact: true }).click();
            correct = await page.evaluate(() => window.quizTest.answer());
            await page.locator('.rumor-quiz-choice').nth(correct).click();
        }
        const progress = await page.evaluate(() => window.quizTest.engine.analysisProgress());
        assert.equal(progress.level, 2); assert.equal(progress.current, 0); assert.equal(progress.required, 30);
        await page.screenshot({ path: path.join(output, prefix + '-promotion.png') });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => window.quizTest.open('copy'));
        await page.getByRole('button', { name: '퀴즈 풀기', exact: true }).click();
        correct = await page.evaluate(() => window.quizTest.answer());
        await page.locator('.rumor-quiz-choice').nth(correct).click();
        assert.equal(await page.locator('.rumor-footer button').isVisible(), true);
        await page.locator('.rumor-quiz-feedback').scrollIntoViewIfNeeded();
        const noOverlap = await page.evaluate(() => {
            const doc = document.querySelector('.rumor-doc-box').getBoundingClientRect();
            const quiz = document.querySelector('.rumor-quiz').getBoundingClientRect();
            return doc.bottom <= quiz.top && document.documentElement.scrollWidth <= innerWidth;
        });
        assert.equal(noOverlap, true);
        await page.screenshot({ path: path.join(output, prefix + '-mobile.png') });
        assert.deepEqual(errors, []);
        const result = { root, progress, wrongRetry: true, reloadDedupe: true, copyDedupe: true,
            promotionRefresh: true, mobile: true, errors, presentation: 'production components/CSS after real application bootstrap' };
        fs.writeFileSync(path.join(output, prefix + '-browser.json'), JSON.stringify(result, null, 2));
        console.log(JSON.stringify(result));
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });