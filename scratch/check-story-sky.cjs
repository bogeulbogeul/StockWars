const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output='output/story-sky-time-v1';fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
    if(req.url==='/favicon.ico')return res.writeHead(204).end();
    const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
    await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
    try{
        const page=await browser.newPage({timezoneId:'Asia/Seoul'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(()=>{const OriginalDate=Date;window.Date=class extends OriginalDate{
            constructor(...args){super(...(args.length?args:['2026-10-25T18:00:00Z']));}
            static now(){return new OriginalDate('2026-10-25T18:00:00Z').getTime();}
        };});
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.seatInteraction,null,{timeout:90000});
        const report=await page.evaluate(async()=>{
            const app=window.stockWarsExhibition,s=app.scenes,sky=s.townModelScene.landscape.sky;
            const {timeOfDayService}=await import('/js/engine/timeOfDayService.js');
            const result={deviceHour:new Date().getHours(),clockStage:timeOfDayService.calculateTimeOfDay(new Date()),
                initial:sky.currentStage(performance.now()),initialPaint:sky.stage};
            timeOfDayService.setTimeOfDay('night');result.manualNight=sky.currentStage(performance.now());
            s.setTime(true);result.sunset=sky.currentStage(performance.now());
            const {exhibitionSkyTime}=await import('/js/data/exhibitionSkyTime.js');
            result.resumeDay=exhibitionSkyTime({});result.resumeSunset=exhibitionSkyTime({sunset:true});
            s.setTime(false,{asleep:true,immediate:true});result.sleep=sky.currentStage(performance.now());
            s.setTime(false,{immediate:true});result.restart=sky.currentStage(performance.now());
            sky.update(performance.now()+1000);result.restartStable=sky.stage;
            return result;
        });
        assert.equal(report.deviceHour,3);assert.equal(report.clockStage,'night');
        for(const key of ['initial','initialPaint','manualNight','resumeDay','restart','restartStable'])assert.equal(report[key],'day',key);
        assert.equal(report.sunset,'sunset');assert.equal(report.resumeSunset,'sunset');assert.equal(report.sleep,'night');assert.deepEqual(errors,[]);
        fs.writeFileSync(`${output}/${prefix}-checks.json`,JSON.stringify({...report,errors},null,2));console.log('PASS',prefix,JSON.stringify(report));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
