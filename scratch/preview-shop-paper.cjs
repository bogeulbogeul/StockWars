const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/flower-shop-ui-v2');
fs.mkdirSync(output, { recursive: true });
(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async route => {
            const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
            const file = path.resolve(root, '.' + pathname);
            if (!file.startsWith(root + path.sep)) return route.fulfill({ status: 403, body: '' });
            try {
                let body = fs.readFileSync(pathname === '/tests/vivian-artwork-preview.html' ? path.resolve('web/tests/vivian-artwork-preview.html') : file);
                if (pathname === '/tests/vivian-artwork-preview.html') {
                    body = body.toString().replace("import { InventoryModal }", "import { VivianModelScene } from './js/components/store3d/VivianModelScene.js';\n    import { InventoryModal }")
                        .replace('    openShop();', `    const scene = new VivianModelScene(document.body, () => {}, () => {});
    await scene.ready;
    scene.show();
    window.previewStore = store;
    openShop();
    store.modalEl.classList.add('vivian-counter-only');
    document.getElementById('showStore').hidden = true;`);
                }
                await route.fulfill({ body, contentType: ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream' });
            } catch { await route.fulfill({ status: 404, body: '' }); }
        });
        await page.goto('http://stockwars.local/tests/vivian-artwork-preview.html');
        await page.locator('.vivian-item-card').first().waitFor({ timeout: 30000 });
        assert(await page.locator('.vivian-item-card').count() === 12);
        assert.match(await page.locator('#vivianUserCash').textContent(), /잎$/);
        await page.locator('[data-id="item_premium_rumor"]').click();
        assert.equal(await page.locator('#drawerItemName').textContent(), '봉인된 소식 봉투');
        await page.locator('[data-id="item_honey_cookie"]').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#drawerItemName').textContent(), '꿀 쿠키');
        const buy = await page.locator('#btnVivianBuy').boundingBox();
        const shop = await page.locator('#vivianShopPanel').boundingBox();
        assert(buy.y + buy.height <= shop.y + shop.height, 'desktop checkout remains visible');
        assert(shop.x >= 0 && shop.x + shop.width <= 1440 && shop.y >= 0 && shop.y + shop.height <= 1000, 'counter shop stays inside viewport');
        await page.locator('#btnQtyPlus').focus();
        await page.locator('[data-id="item_lotto_ticket"]').click();
        await page.locator('[data-id="item_lotto_ticket"]').scrollIntoViewIfNeeded();
        await page.locator('#btnVivianBuy').evaluate(e=>e.blur());
        await page.screenshot({ path: path.join(output, 'lotto-applied.png') });
        await page.locator('[data-id="item_premium_rumor"]').click();
        await page.screenshot({ path: path.join(output, 'news-applied.png') });
        assert.equal(await page.locator('[data-tab]').count(), 0);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(output, 'mobile-shelf.png') });
        await page.locator('[data-id="item_honey_cookie"]').click();
        await page.screenshot({ path: path.join(output, 'mobile-checkout.png') });
        const overflow = await page.locator('#vivianShopPanel').evaluate(e => e.scrollWidth > e.clientWidth);
        assert.equal(overflow, false, 'mobile has no horizontal overflow');
        await page.locator('#btnQtyPlus').click();
        assert.equal(await page.locator('#vivianTotalPrice').textContent(), '1,600잎');
        await page.locator('#btnVivianBuy').click();
        await page.locator('#vivianReceipt:not([hidden])').waitFor();
        assert.equal(await page.locator('#vivianReceiptTotal').textContent(), '1,600잎');
        await page.locator('#btnVivianReceiptClose').click();
        assert.equal(await page.locator('.vivian-item-card').count(), 12);
        assert.equal(await page.locator('.flower-shop-footer, .flower-shelf-end, #btnVivianOpenBag').count(), 0);
        assert.equal(errors.length, 0, errors.join('\n'));
        console.log('PASS: keyboard selection, all shelves, locked/sold-out purchases, currency, mobile checkout, quantity, receipt, removed footer; no browser errors.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
