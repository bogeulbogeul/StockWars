const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/rumor-result-buttons-2026-10-25');
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
        res.setHeader('Content-Type', ({ '.svg': 'image/svg+xml', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.txt': 'text/plain; charset=utf-8' })[path.extname(file)] || 'application/octet-stream');
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
        const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        const url = `http://127.0.0.1:${server.address().port}/__quiz-check`;
        await page.goto(url); await mount(page);
        await page.locator('.rumor-quiz-start').click();
        const correct = await page.evaluate(() => window.quizTest.answer());
        await page.locator('.rumor-quiz-choice').nth((correct + 1) % 3).click();
        assert.match(await page.locator('.rumor-quiz-feedback').textContent(), /정답:/);
        assert.match(await page.locator('.rumor-quiz-choice').nth(correct).textContent(), /✓ 정답/);
        for (const b of await page.locator('.rumor-quiz-choice').all()) assert.equal(await b.isDisabled(), true);
        assert.equal(await page.locator('.rumor-quiz-stamp').isVisible(), false);
        assert.equal(await page.locator('.rumor-quiz-later').count(), 0);
        assert.equal(await page.evaluate(() => window.quizTest.engine.analysisProgress().current), 0);
        await page.screenshot({ path: path.join(output, prefix + '-wrong.png') });
        await page.reload(); await mount(page);
        await page.locator('.rumor-quiz-start').click();
        assert.match(await page.locator('.rumor-quiz-feedback').textContent(), /정답:/);
        assert.equal(await page.locator('.rumor-quiz-choice').first().isDisabled(), true);
        await page.evaluate(() => window.quizTest.open('copy'));
        await page.locator('.rumor-quiz-start').click();
        assert.equal(await page.locator('.rumor-quiz-choice').first().isDisabled(), true);
        assert.equal(await page.evaluate(() => window.quizTest.engine.analysisProgress().current), 0);
        await page.evaluate(() => window.quizTest.open('sample-1'));
        await page.locator('.rumor-quiz-start').click();
        const answer = await page.evaluate(() => window.quizTest.answer());
        await page.locator('.rumor-quiz-choice').nth(answer).click();
        assert.equal(await page.locator('.rumor-quiz-stamp').isVisible(), true);
        assert.equal(await page.locator('.rumor-quiz-later').count(), 0);
        assert.equal(await page.evaluate(() => window.quizTest.engine.analysisProgress().current), 1);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => window.quizTest.open('copy'));
        await page.locator('.rumor-quiz-start').click();
        await page.waitForTimeout(100);
        await page.screenshot({ path: path.join(output, prefix + '-mobile.png') });
        assert.deepEqual(errors, []);
        const result = { root, wrongRevealsAnswer: true, wrongLocksChoices: true,
            reloadAndCopyNoReward: true, separateEventCorrectReward: 1, errors };
        fs.writeFileSync(path.join(output, prefix + '-browser.json'), JSON.stringify(result, null, 2));
        console.log(JSON.stringify(result));
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exitCode = 1; server.close(); });
