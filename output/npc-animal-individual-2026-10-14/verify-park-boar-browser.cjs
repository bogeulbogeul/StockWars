const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');const root=path.resolve(__dirname,'../..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(e?'missing':b);});});
(async()=>{let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const page=await browser.newPage({viewport:{width:1500,height:1000}});
await page.goto('http://127.0.0.1:'+server.address().port+'/web/tests/park-boar-preview.html');await page.waitForFunction(()=>window.parkPreviewReady);

const results=[];for(const exp of ['neutral','smile','angry','worried']){results.push(await page.evaluate(exp=>{const t=window.parkPreview; t.steps[0].expression=exp;t.showStep(0);const p=t.portraitImage;return {exp,asset:p.src,width:p.clientWidth,height:p.clientHeight};},exp));await page.evaluate(async()=>{await window.parkPreview.portraitImage.decode()});await page.screenshot({path:path.join(__dirname,'park-boar-'+exp.toLowerCase()+'-applied.png')});}
fs.writeFileSync(path.join(__dirname,'park-boar-render-result.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();server.close();}})();
