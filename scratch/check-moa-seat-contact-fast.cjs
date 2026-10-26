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
    await new Promise(resolve => server.listen(8112, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true, channel:'msedge'});
    try {
        const page = await browser.newPage({viewport:{width:1440,height:1000}});
        const errors=[];
        const failedAssets=[];
        page.on('pageerror', e=>errors.push(e.message));
        page.on('response', response=>{
            if(response.status()>=400 && /\/assets\//.test(response.url())) failedAssets.push(response.url());
        });
        await page.goto('http://127.0.0.1:8112/?demo=standard');
        await page.waitForFunction(()=>(window.stockWarsExhibition?.scenes?.townModelScene || window.stockWarsApp?.townModelScene)?.sleepingAnna?.mixer,null,{timeout:90000});


        const report=await page.evaluate(async()=>{
            const T=await import('/vendor/three/three.module.js');
            const view=window.stockWarsApp.townModelScene,moa=view.sleepingAnna;
            view.arrivalActive=true;await moa.setAwake(false);
            const stop=view.scene.getObjectByName('village_bus_stop'),seat=stop.getObjectByName('Bench_Seat');
            const box=new T.Box3().setFromObject(seat),point=new T.Vector3(),ray=new T.Raycaster();
            const materials=[seat.material].flat(),sides=materials.map(m=>m.side);materials.forEach(m=>m.side=T.DoubleSide);
            const geo=seat.geometry,indices=geo.index,vertices=geo.attributes.position,planes=[];const v=i=>new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(seat.matrixWorld);for(let i=0;i<(indices?indices.count:vertices.count);i+=3){const a=v(indices?indices.getX(i):i),b=v(indices?indices.getX(i+1):i+1),c=v(indices?indices.getX(i+2):i+2);const p=new T.Plane().setFromCoplanarPoints(a,b,c);if(p.normal.length()<.5)continue;if(!planes.some(q=>q.normal.distanceTo(p.normal)<1e-4&&Math.abs(q.constant-p.constant)<.001))planes.push(p);}let convexError=0;for(let i=0;i<vertices.count;i++)for(const plane of planes)convexError=Math.max(convexError,plane.distanceToPoint(v(i)));if(convexError>.03)throw Error('Seat is not convex: '+convexError);let rows=[],worst=0,total=0;
            const distance=(p,dir)=>{ray.set(p,dir);return ray.intersectObject(seat,false).filter(hit=>hit.distance>1e-5);};
            for(let f=0;f<=80;f++){
                if(f)moa.update(.1);moa.root.updateMatrixWorld(true);
                let count=0,depth=0,candidates=0;
                moa.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();
                    for(let i=0;i<mesh.geometry.attributes.position.count;i++){
                        mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);
                        if(!box.containsPoint(point))continue;candidates++;
                        let d=Infinity,inside=true;for(const plane of planes){const signed=plane.distanceToPoint(point);if(signed>=-.001){inside=false;break;}d=Math.min(d,-signed);}if(!inside)continue;
                        count++;depth=Math.max(depth,d);
                    }
                });rows.push({time:f/10,count,depth,candidates});worst=Math.max(worst,depth);total+=count;
            }
            materials.forEach((m,i)=>m.side=sides[i]);
            window.contactView=view;
            return {worstDepth:worst,totalInsideSamples:total,seatBounds:{min:box.min.toArray(),max:box.max.toArray()},rows};
        });
        fs.writeFileSync('scratch/moa-seat-contact-report.json',JSON.stringify(report,null,2));
        console.log(JSON.stringify({worstDepth:report.worstDepth,totalInsideSamples:report.totalInsideSamples,rows:report.rows.filter(r=>r.count).slice(0,3),errors,failedAssets}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

