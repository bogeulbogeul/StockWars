from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = (root / 'scratch/check-analysis-quiz.cjs').read_text(encoding='utf-8')
source = source.replace('output/analysis-quiz-2026-10-25', 'output/authored-quiz-rollout-2026-10-25')
marker = "        await page.getByRole('button', { name: '해석 확인하기', exact: true }).click();"
check = '''        // Verify actual UI text at every band boundary before testing rewards.
        for (const level of [1, 3, 4, 6, 7, 10]) {
            const expected = await page.evaluate(async level => {
                const { AUTHORED_RUMOR_QUIZZES: bank } = await import('/js/data/authoredRumorQuizzes.js');
                const test = window.quizTest;
                const item = test.engine.state.inventory.find(item => item.id === 'sample-0');
                item.interpretationLevel = level;
                test.open(item.id); test.popup.quizCard.open();
                const entry = bank.find(q => q.eventId === item.rumorId
                    && q.minLevel === (level <= 3 ? 1 : level <= 6 ? 4 : 7));
                return { question: entry.question, choices: entry.choices };
            }, level);
            assert.equal(await page.locator('.rumor-quiz-question').textContent(), expected.question);
            assert.deepEqual(await page.locator('.rumor-quiz-choice').allTextContents(), expected.choices);
            assert.equal(await page.locator('.rumor-quiz-question').count(), 1);
        }
        await page.screenshot({ path: path.join(output, prefix + '-authored-high.png') });
        await page.evaluate(() => {
            const test = window.quizTest;
            test.engine.state.inventory.find(item => item.id === 'sample-0').interpretationLevel = 1;
            test.open('sample-0');
        });
'''
assert marker in source
source = source.replace(marker, check + marker, 1)
(root / 'scratch/check-authored-quiz.cjs').write_text(source, encoding='utf-8')
