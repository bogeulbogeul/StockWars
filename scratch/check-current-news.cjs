const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/news-rollout-2026-10-25');
const expected = JSON.parse(fs.readFileSync('Docs/Data/CorporateNews_Current.json', 'utf8'));
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__news-check') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end('<!doctype html><html><body><div id="host"></div></body></html>');
    }
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const origin = `http://127.0.0.1:${server.address().port}`;
        await page.goto(origin + '/__news-check');
        const result = await page.evaluate(async expected => {
            const { INITIAL_STOCKS, INITIAL_NEWS } = await import('/js/data/stocksData.js');
            const { marketEngine } = await import('/js/engine/marketEngine.js');
            marketEngine.stopEngine();
            const { NewsDetailModal } = await import('/js/components/NewsDetailModal.js');
            const modal = new NewsDetailModal(document.querySelector('#host'), {
                getNewsItem: id => marketEngine.news.find(article => article.id === id)
            });
            const assert = (ok, text) => { if (!ok) throw Error(text); };
            assert(INITIAL_NEWS.length === 288 && marketEngine.news.length === 288, 'engine catalog size');
            for (const original of expected) {
                const article = marketEngine.news.find(item => item.id === original.id);
                assert(article, original.id);
                for (const key of Object.keys(original)) {
                    assert(JSON.stringify(article[key]) === JSON.stringify(original[key]), `manuscript ${original.id}/${key}`);
                }
                assert(article.type === '뉴스' && !('impact' in article), 'no invented impact');
                modal.open(article.id);
                assert(document.querySelector('#newsDetailTitle').textContent === article.title, 'article title');
                assert(JSON.stringify([...document.querySelectorAll('#newsDetailContent p')].map(p => p.textContent)) === JSON.stringify(article.body), 'full article body');
                modal.close();
            }
            for (const stock of INITIAL_STOCKS) {
                const articles = marketEngine.news.filter(article => article.stockId === stock.id);
                assert(articles.length === 4 && articles.every(article => article.companyName === stock.name), 'stock association');
            }
            const titles = marketEngine.news.map(article => article.id);
            marketEngine.reset();
            marketEngine.stopEngine();
            assert(JSON.stringify(marketEngine.news.map(article => article.id)) === JSON.stringify(titles), 'restart catalog');
            return { articles: 288, companies: 72, fullArticleReads: 288, manuscriptMatch: true, reset: true };
        }, expected);
        assert.deepEqual(errors, []);
        result.errors = errors;
        result.root = root;
        result.scope = 'HTTP browser imports, real MarketEngine and isolated NewsDetailModal; retired UI not restored';
        fs.writeFileSync(path.join(output, root.includes('win-unpacked') ? 'desktop-browser.json' : 'web-browser.json'), JSON.stringify(result, null, 2));
        console.log(JSON.stringify(result));
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
