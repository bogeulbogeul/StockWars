const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') return res.writeHead(204).end();
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(8111, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true, channel:'msedge'});
    try {
        const page = await browser.newPage({viewport:{width:1440,height:1000}});
        const errors=[];
        const failedAssets=[];
        page.on('pageerror', e=>errors.push(e.message));
        page.on('response', response=>{
            if(response.status()>=400 && /\/assets\//.test(response.url())) failedAssets.push(response.url());
        });
        await page.goto('http://127.0.0.1:8111/?demo=standard');
        await page.waitForFunction(()=>(window.stockWarsExhibition?.scenes?.townModelScene || window.stockWarsApp?.townModelScene)?.sleepingAnna?.mixer,null,{timeout:90000});


        const pictures=await page.evaluate(async()=>{
            const T=await import('/vendor/three/three.module.js');const view=window.stockWarsApp.townModelScene,moa=view.sleepingAnna;
            view.arrivalActive=true;await moa.setAwake(false);moa.update(.1);view.player.update(0);
            const renderer=view.renderer,camera=view.camera.clone();renderer.setPixelRatio(1);renderer.setSize(960,720);camera.aspect=4/3;camera.updateProjectionMatrix();
            const target=new T.Vector3(1020,65,moa.root.position.z);view.landscape.update(target.x,target.z,view.town.playerController.renderPosition);
            let images={};for(const [name,offset] of [['front',[0,110,430]],['side',[-360,70,150]]]){camera.position.copy(target).add(new T.Vector3(...offset));camera.lookAt(target);renderer.render(view.scene,camera);images[name]=renderer.domElement.toDataURL('image/png').split(',')[1];}return images;
        });
        for(const [name,data]of Object.entries(pictures))fs.writeFileSync('scratch/moa-seat-contact-'+name+'.png',Buffer.from(data,'base64'));
        assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);console.log('Front and side contact views saved.');
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

