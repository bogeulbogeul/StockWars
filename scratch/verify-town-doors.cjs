const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end();
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(8776, '127.0.0.1', resolve));
    browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const page = await browser.newPage({viewport:{width:1600,height:1000}}), errors=[];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8776/web/tests/townRendering.browser.html');
    await page.waitForFunction(() => window.townRenderResult);
    const rendered = await page.evaluate(() => window.townRenderResult);
    assert.ok(rendered.pass, JSON.stringify(rendered));
    const expected = {home_office_tower:'OfficeBuilding-door-v2',vivian_store:'VivianStore-door-v3',bit_logistics:'Bit-door-v2',cipher_securities:'CipherBuilding-door-v2',julian_furniture:'MordenFrame-single-story-v1',claire_apparel:'SalonDeTail-single-story-v3',data_ink_bookstore:'BookStore-single-story-v1',node_finance:'BankBuilding-single-story-v1',midnight_pub:'MidnightPub-single-story-v1',barter_pawn_shop:'BarterPawnShop-single-story-v1'};
    for (const [id, file] of Object.entries(expected)) assert.ok(rendered.rows.find(row => row.id === id).src.endsWith(file+'.png'), id);
    assert.ok(rendered.rows.find(row => row.id==='home_office_tower').src.endsWith('OfficeBuilding-door-v2.png'));
    assert.ok(rendered.rows.find(row => row.id==='cipher_securities').src.endsWith('CipherBuilding-door-v2.png'));
    await page.goto('http://127.0.0.1:8776/scratch/preview-town-assets.html?overview');
    await page.waitForSelector('#building_barter_pawn_shop image');
    await page.click('#previewDay');
    await page.waitForTimeout(500);
    await page.screenshot({path:'output/town-door-resize-v1/game-overview.png'});
    await page.click('#previewCompare');
    for (const id of Object.keys(expected)) {
      await page.selectOption('#previewBuilding', id);
      await page.waitForTimeout(250);
      await page.screenshot({path:`output/town-door-resize-v1/game-${id}.png`});
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync('output/town-door-resize-v1/game-check.json', JSON.stringify({pass:true,rows:rendered.rows,errors},null,2));
    console.log('Passed: door and single-story assets rendered, no browser errors. Screenshots saved.');
  } finally { if(browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });

