from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
base = (root / 'scratch/check-rumor-quiz-minimal.cjs').read_text(encoding='utf-8').split('\n(async () => {', 1)[0]
base = base.replace('output/rumor-quiz-minimal-2026-10-25', 'output/rumor-wrong-final-2026-10-25')
base = base.replace("'.js': 'text/javascript'", "'.svg': 'image/svg+xml', '.js': 'text/javascript'")
body = r'''
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
'''
(root / 'scratch/check-wrong-final.cjs').write_text(base + body, encoding='utf-8')
for file in ['js/engine/AnalysisGrowth.js', 'js/components/inventory/RumorQuizCard.js']:
    shutil.copy2(root / 'web' / file, root / 'electron-app/dist/win-unpacked/resources/web' / file)
