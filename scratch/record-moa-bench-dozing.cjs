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

        const recording=await page.evaluate(async()=>{
            document.querySelector('.crayon-title')?.remove();
            const THREE=await import('/vendor/three/three.module.js');
            const view=window.stockWarsApp.townModelScene,moa=view.sleepingAnna;
            view.arrivalActive=true;
            await moa.setAwake(false);
            const camera=view.camera.clone(),renderer=view.renderer;
            renderer.setPixelRatio(1);renderer.setSize(960,720);
            camera.aspect=960/720;camera.updateProjectionMatrix();
            const target=new THREE.Vector3(1020,68,moa.root.position.z+8);
            const distance=300/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
            const pitch=THREE.MathUtils.degToRad(18);
            camera.position.set(target.x,target.y+Math.sin(pitch)*distance,target.z+Math.cos(pitch)*distance);
            camera.lookAt(target);
            view.landscape.update(target.x,target.z,view.town.playerController.renderPosition);
            view.player.update(0);
            renderer.render(view.scene,camera);
            const canvas=renderer.domElement;
            const stream=canvas.captureStream(30);
            const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:5000000});
            const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
            const complete=new Promise(resolve=>recorder.onstop=resolve);
            recorder.start();let previous=performance.now();const start=previous;
            await new Promise(resolve=>{const draw=now=>{moa.update(Math.min((now-previous)/1000,.1));previous=now;renderer.render(view.scene,camera);if(now-start<10000)requestAnimationFrame(draw);else resolve();};requestAnimationFrame(draw);});
            recorder.stop();await complete;stream.getTracks().forEach(track=>track.stop());
            const blob=new Blob(chunks,{type:'video/webm'});
            return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);});
        });
        fs.writeFileSync('scratch/moa-bench-dozing.webm',Buffer.from(recording,'base64'));
        await page.screenshot({path:'scratch/moa-bench-video-preview.png'});
        assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);
        console.log('Recorded 10 seconds of actual seated Moa animation.');
    } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

