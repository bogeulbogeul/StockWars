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


        const result=await page.evaluate(async()=>{
            const T=await import('/vendor/three/three.module.js');const scene=window.stockWarsExhibition.scenes.townModelScene;
            const actor=scene.sleepingAnna,update=actor.update;actor.update=()=>{};
            const canvas=scene.renderer.domElement,parent=canvas.parentNode,environment=scene.scene.environment;
            const oldSize=scene.renderer.getSize(new T.Vector2());
            const host=document.createElement('div');host.style.cssText='position:fixed;left:0;top:0;z-index:30000';host.style.width=oldSize.x+'px';host.style.height=oldSize.y+'px';document.body.append(host);
            const {createArrivalView}=await import('/js/app/arrival/BusArrivalView.js');const view=createArrivalView(host);await view.ready;view.render(40,1,true);
            const sameCanvas=host.contains(canvas),sameEnvironment=scene.scene.environment===environment,exposure=scene.renderer.toneMappingExposure;
            const before=canvas.toDataURL('image/png').split(',')[1];
            view.dispose();scene.draw();const after=canvas.toDataURL('image/png').split(',')[1];
            const restored=canvas.parentNode===parent&&scene.renderer.getSize(new T.Vector2()).equals(oldSize)&&!scene.renderer.getContext().isContextLost();
            const point=new T.Vector3(actor.root.position.x,actor.root.position.y+78,actor.root.position.z+5).project(scene.camera);
            const pixel={x:Math.round((point.x+1)/2*canvas.width),y:Math.round((1-point.y)/2*canvas.height)};
            const sample=async data=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const c=document.createElement('canvas');c.width=1280;c.height=800;const ctx=c.getContext('2d');ctx.drawImage(image,0,0,1280,800);return ctx.getImageData(Math.round((point.x+1)*640)-20,Math.round((1-point.y)*400)-20,40,40).data;};const a=await sample(before),b=await sample(after);let sum=0,max=0;for(let i=0;i<a.length;i++){if(i%4===3)continue;const d=Math.abs(a[i]-b[i]);sum+=d;max=Math.max(max,d);}const pixels={meanDifference:sum/(40*40*3),maxDifference:max};actor.update=update;host.remove();return {sameCanvas,sameEnvironment,exposure,restored,pixel,pixels,before,after};
        });
        fs.writeFileSync('scratch/arrival-lighting-before.png',Buffer.from(result.before,'base64'));
        fs.writeFileSync('scratch/arrival-lighting-after.png',Buffer.from(result.after,'base64'));
        delete result.before;delete result.after;
        assert(result.sameCanvas&&result.sameEnvironment&&result.restored);assert(result.pixels.meanDifference<1);assert.deepEqual(errors,[]);
        fs.writeFileSync('scratch/arrival-lighting-report.json',JSON.stringify({result,errors},null,2));console.log(JSON.stringify({result,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
