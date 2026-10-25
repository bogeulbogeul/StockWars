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
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(r.url()); });

        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(()=>window.stockWarsExhibition?.arrival?.active&&window.stockWarsExhibition?.scenes?.townModelScene?.sleepingAnna);

        await page.waitForSelector('.moa-movement-guide:not([hidden])');

        const folder=path.resolve('scratch/moa-three-calls-frames');fs.mkdirSync(folder,{recursive:true});
        const cdp=await page.context().newCDPSession(page),frames=[];
        cdp.on('Page.screencastFrame',event=>{
            const file=path.join(folder,String(frames.length).padStart(5,'0')+'.jpg');
            fs.writeFileSync(file,Buffer.from(event.data,'base64'));frames.push({file,time:event.metadata.timestamp});
            void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
        });
        await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:1280,maxHeight:800,everyNthFrame:1});
        const start=Date.now(),actions=[];
        await page.waitForTimeout(2300);
        await page.keyboard.down('d');await page.keyboard.down('w');
        await page.waitForTimeout(360);await page.keyboard.up('d');await page.keyboard.up('w');
        await page.waitForFunction(()=>!document.querySelector('.moa-movement-guide [data-interact]').disabled);
        actions.push({action:'approached',time:(Date.now()-start)/1000});
        await page.waitForTimeout(1300);
        for(let n=1;n<=3;n++){
            await page.keyboard.press('f');actions.push({action:'F',count:n,time:(Date.now()-start)/1000});
            if(n<3){assert.equal(await page.evaluate(()=>window.stockWarsExhibition.state.moaCalls),n);assert.equal(await page.evaluate(()=>window.stockWarsExhibition.scenes.townModelScene.sleepingAnna.root.userData.sleeping),true);await page.waitForTimeout(1900);}
        }
        await page.waitForFunction(()=>{const a=window.stockWarsExhibition;return a.state.flags.moaAwake&&!a.scenes.townModelScene.sleepingAnna.root.userData.seated&&!a.busy;});
        actions.push({action:'stood',time:(Date.now()-start)/1000});
        await page.waitForTimeout(3100);await cdp.send('Page.stopScreencast');
        assert(frames.length>30);assert.deepEqual(errors,[]);
        const lines=[];for(let i=0;i<frames.length;i++){lines.push("file '"+frames[i].file.replaceAll('\\','/')+"'");if(i<frames.length-1)lines.push('duration '+Math.max(.01,frames[i+1].time-frames[i].time).toFixed(6));}
        fs.writeFileSync('scratch/moa-three-calls-video.txt',lines.join('\n')+'\n');
        fs.writeFileSync('scratch/moa-three-calls-video-report.json',JSON.stringify({frames:frames.length,actions,errors},null,2));
        console.log(JSON.stringify({frames:frames.length,actions,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
