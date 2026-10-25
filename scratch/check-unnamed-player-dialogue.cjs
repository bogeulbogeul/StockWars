const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});


(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.view);const result=await page.evaluate(async()=>{const a=window.stockWarsExhibition,v=a.view;a.arrival.stop();v.state=a.state;const {activitySpeech}=await import('/js/app/exhibition/ActivityDialogue.js');const {createMoaWakeDialogue}=await import('/js/components/dialogue/MoaWakeDialogue.js');const read=()=>({name:v.panel.querySelector('.exhibition-speaker').textContent,theme:v.panel.dataset.dialogueTheme,text:v.panel.innerText});a.state.nickname='';v.line({speaker:'소망이',text:'아직 못 정했어.'},()=>{});const before=read();activitySpeech(v,'소망이','먼저 말을 걸어볼까?');const guide=read();const reminder=createMoaWakeDialogue();reminder.showLine('우선 저 아이에게 말을 걸어보자.');const unknown=reminder.element.querySelector('.vn-speaker-name').textContent;reminder.dispose();a.state.nickname='별빛';v.line({speaker:'소망이',text:'[닉네임]이라고 불러줘.'},()=>{});const after=read();return {before,guide,unknown,after};});assert.equal(result.before.name,'???');assert.equal(result.guide.name,'???');assert.equal(result.unknown,'???');assert.equal(result.after.name,'별빛');assert(result.after.text.includes('별빛이라고'));assert.equal(result.before.theme,result.after.theme);console.log(JSON.stringify(result));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});