const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../..'),out=__dirname;
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(err?'missing':data);});});
(async()=>{let browser;try{
await new Promise(r=>server.listen(0,'127.0.0.1',r));
browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1500,height:1000}});
page.on('pageerror',e=>console.error(e.message));
await page.goto('http://127.0.0.1:'+server.address().port+'/web/tests/cipher-agent-preview.html');
await page.waitForFunction(()=>window.kPreviewLobby?.roomPackage.background.naturalWidth);
await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'agent-k-lobby-applied.png')});
const result=await page.evaluate(async()=>{const l=window.kPreviewLobby;l.player.x=669;l.player.y=585;l.draw();l.talkToAgentK();const p=l.notice.querySelector('img');await p.decode();return {room:l.roomPackage.background.src,portrait:p.src,dialogueVisible:!l.notice.hidden,nearAgent:l.nearAgentK(),portraitLoaded:p.naturalWidth>0};});
await page.screenshot({path:path.join(out,'agent-k-dialogue-applied.png')});
fs.writeFileSync(path.join(out,'agent-k-render-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
if(!result.dialogueVisible||!result.nearAgent||!result.portraitLoaded)process.exitCode=1;
} catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();server.close();}})();
