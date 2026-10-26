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

(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge',args:['--autoplay-policy=no-user-gesture-required']});try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/js/app/arrival/BusArrivalAudio.js');const result=await page.evaluate(async()=>{const {createBusArrivalAudio}=await import('/js/app/arrival/BusArrivalAudio.js');const old=window.Audio;const list=[];window.Audio=function(src){const a=new old(src);list.push(a);return a};const a=createBusArrivalAudio();a.update({progress:.6,departure:0,departed:false});await Promise.all(list.map(x=>new Promise((r,j)=>{if(x.readyState>=2)return r();x.addEventListener('loadeddata',r,{once:true});x.addEventListener('error',()=>j(Error(x.src)),{once:true})})));await new Promise(r=>setTimeout(r,150));const driving=!list[0].paused&&list[0].currentTime>0;a.update({progress:1,departure:0,departed:false});await new Promise(r=>setTimeout(r,100));const brake=!list[1].paused;a.update({progress:1,departure:3,departed:false});const rate=list[0].playbackRate;a.update({progress:1,departure:6,departed:true});const ended=list.every(x=>x.paused);a.dispose();return {driving,brake,rate,ended,durations:list.map(x=>x.duration)}});assert(result.driving&&result.brake&&result.ended&&result.rate>.75);console.log(JSON.stringify(result));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});