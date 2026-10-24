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
        await page.goto('http://stockwars.local/packing.html');
        await page.evaluate(async () => {
            document.querySelector('dialog[open]')?.close();
            const {PackingGame} = await import('/js/components/packing/PackingGame.js');
            window.previewPacking = new PackingGame(); previewPacking.open();
        });
        await page.locator('dialog[open] .packing-item-card').first().waitFor();
        await page.screenshot({path:'output/packing-ui-v1/current-2026-10-25.png'});
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
