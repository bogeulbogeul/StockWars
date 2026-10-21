const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web');
const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();
        res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
    await new Promise(r=>server.listen(8110,'127.0.0.1',r));
    const browser=await chromium.launch({headless:true,channel:'msedge'});
    try{
        const page=await browser.newPage(); const errors=[],retired=[];
        page.on('pageerror',e=>errors.push(e.stack));
        page.on('request',r=>{if(/assets\/interiors\/cipher\/|CipherBuilding.*\.png/.test(r.url()))retired.push(r.url());});
        await page.goto('http://127.0.0.1:8110/');
        await page.waitForTimeout(3000);
        const state=await page.evaluate(()=>({app:!!window.stockWarsApp,town:!!window.stockWarsApp?.townStage,
            loaded:window.stockWarsApp?.townModelScene?.loadedCount}));
        if(retired.length)throw Error('Retired image requested: '+retired.join(','));
        console.log(JSON.stringify({retiredRequests:retired,state,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
