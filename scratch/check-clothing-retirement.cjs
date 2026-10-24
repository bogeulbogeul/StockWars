const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
for (const name of ['anna', 'agent-k', 'bongbong']) assert.equal(fs.existsSync(path.join(root, 'assets/characters/3d', name)), false);
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
        page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR', e.message); });
        page.on('console', message => { if (message.type() === 'error') console.error('CONSOLE', message.text()); });
        page.on('response', r => { if (r.status() >= 400) { console.error('MISSING', r.url()); if (/\/assets\//.test(r.url())) errors.push(r.url()); } });
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=standard`);
        console.log('PAGE LOADED', root);
        console.log('BOOT', await page.evaluate(() => ({ app: !!window.stockWarsApp, town: !!window.stockWarsApp?.townModelScene, state: window.stockWarsApp?.townModelScene?.player?.state, status: window.stockWarsApp?.townModelScene?.status?.textContent })));
        await page.waitForFunction(() => window.stockWarsApp?.inventoryModal && window.stockWarsApp?.townModelScene);
        await page.evaluate(() => window.stockWarsApp.townModelScene.ready);
        const result = await page.evaluate(async () => {
            const app=window.stockWarsApp;
            const { HOME_PLACES }=await import('/js/components/office/OfficeRoomPackage.js');
            const { TOWN_MODEL_BUILDINGS }=await import('/js/data/townModelBuildings.js');
            const { villagePathRoutes }=await import('/js/data/townLandscapeLayout.js');
            const inv=app.inventoryModal;
            const old={id:'retired_clothes_test',name:'옛 의상',desc:'보존',category:'apparel',quantity:1,isEquipped:true};
            inv.items.push(old);
            inv.handleItemAction(old);
            const filtered=inv.getFilteredItems();
            inv.renderDetail(old);
            const noWear=!inv.detailContainer.querySelector('#btnInvActionPrimary');
            inv.giftMode={eligible:()=>true};
            const noGiftClothes=!inv.getFilteredItems().some(i=>i.id===old.id);
            inv.giftMode=null;
            const answer={noWardrobe:!app.wardrobeModal&&!document.querySelector('#wardrobeModal'),
                noHomeWardrobe:!HOME_PLACES.some(p=>p.action==='onOpenWardrobe'),
                noClothesInBag:!filtered.some(i=>i.id===old.id),noWear,noGiftClothes,
                preserved:old.isEquipped&&inv.items.includes(old),
                noSalon:!app.salonInterior&&!document.querySelector('.salon-interior'),
                noStore:!TOWN_MODEL_BUILDINGS.some(b=>b.id==='claire_apparel'),
                validPaths:villagePathRoutes().flat(2).every(Number.isFinite),
                noStyleShop:!document.querySelector('.salon-style-shop,.salon-makeover-effect'),
                noSelection:!document.querySelector('[data-style-id]')};
            inv.items.pop();inv.renderGrid();return answer;
        });
        for(const [key,value] of Object.entries(result)) if(key!=='greeting') assert.equal(value,true,key);
        console.log(result);
        assert.deepEqual(errors, []);
        console.log('PASS clothing retirement, inventory preservation and clothing-store removal',root);
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
