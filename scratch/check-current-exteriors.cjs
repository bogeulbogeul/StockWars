const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output=process.argv[3]||'output/exterior-current-rollout-2026-10-25';
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
    if(req.url==='/favicon.ico')return res.writeHead(204).end();
    const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
    await new Promise(r=>server.listen(8128,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
    try{
        const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'America/New_York'}),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
        await page.goto('http://127.0.0.1:8128/');
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.status.hidden
            &&window.stockWarsApp.townModelScene.player?.root?.parent
            &&window.stockWarsApp.townModelScene.sleepingAnna!==undefined,null,{timeout:90000});
        await page.evaluate(()=>{document.body.classList.add('town-model-mode','ui-paused');window.stockWarsApp.townStage.containerEl.classList.remove('hidden');});
        if(output.includes('path-refresh'))await page.evaluate(()=>{
            const s=window.stockWarsApp.townModelScene;
            s.scene.userData.skyTimeOfDay='day';s.scene.userData.townWeather='clear';
            s.landscape.sky.update(performance.now(),true);s.landscape.snow.update(performance.now(),true);
            if(s.scene.getObjectByName('home_garden_tree'))throw Error('House-front tree must be removed');
        });
        const report=await page.evaluate(async()=>{
            const THREE=await import('/vendor/three/three.module.js');
            const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
            const {koreaClockSeconds}=await import('/js/components/town3d/BuildingClock.js');
            const {villagePathRoutes,TOWN_ARRIVAL}=await import('/js/data/townLandscapeLayout.js');
            const {TOWN_MODEL_PROPS}=await import('/js/data/townModelProps.js');
            const {TOWN_BUS_ROAD}=await import('/js/data/townBusRoad.js');
            const s=window.stockWarsApp.townModelScene,p=s.town.playerController;
            const gap=(a,b)=>{
                const x=new THREE.Box3().setFromObject(s.scene.getObjectByName(a));
                const y=new THREE.Box3().setFromObject(s.scene.getObjectByName(b));
                return Math.hypot(Math.max(0,x.min.x-y.max.x,y.min.x-x.max.x),
                    Math.max(0,x.min.z-y.max.z,y.min.z-x.max.z)*.4383711467890774);
            };
            const doorNames={home_office_tower:'Home_Continuous_Wood_Door_Frame',settlement_information:'Door_Continuous_Cream_Surround',
                julian_furniture:'Entry_Double_Door_Leaf',cipher_securities:'Door_Continuous_Arch_Frame',node_finance:'Central_Double_Door_Leaf',
                midnight_pub:'Double_Arch_Door_Left',post_office:'Door_Continuous_Arch_Surround'};
            const result={buildings:{},overlaps:[],clock:[]},boxes=[];
            for(const d of TOWN_MODEL_BUILDINGS){
                const model=s.scene.getObjectByName(d.id);if(!model)throw Error('Missing '+d.id);
                const b=new THREE.Box3().setFromObject(model),nodes=[];model.traverse(o=>nodes.push(o.name));
                const v={width:b.max.x-b.min.x,expected:d.width,blocked:!p.canStand(d.x,d.y),
                    frontClear:p.canStand(d.x+(d.entranceOffsetX||0),d.y+50),nodes:nodes.length};
                boxes.push({id:d.id,minX:b.min.x,maxX:b.max.x,minY:b.min.z*.4383711467890774,maxY:d.y});
                if(doorNames[d.id]){const door=new THREE.Box3().setFromObject(model.getObjectByName(doorNames[d.id]));v.doorHeight=door.max.y-door.min.y;}
                if(['home_office_tower','settlement_information','cipher_securities','post_office'].includes(d.id)){
                    const door=new THREE.Box3().setFromObject(model.getObjectByName(doorNames[d.id]));
                    v.doorAlignment=Math.abs((door.min.x+door.max.x)/2-d.x-(d.entranceOffsetX||0));
                }
                result.buildings[d.id]=v;
            }
            for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
                const a=boxes[i],b=boxes[j];if(a.minX<b.maxX&&a.maxX>b.minX&&a.minY<b.maxY&&a.maxY>b.minY)result.overlaps.push([a.id,b.id]);
            }
            const clock=s.buildingClocks[0];
            for(const [iso,seconds] of [['2026-10-18T15:00:00Z',0],['2026-10-18T18:00:00Z',10800],['2026-10-18T21:30:00Z',23400],['2026-10-19T03:15:30Z',44130]]){
                if(koreaClockSeconds(Date.parse(iso))!==seconds)throw Error('KST');clock.update(Date.parse(iso));
                for(const h of clock.hands){const positions=h.object.geometry.attributes.position;let tip=new THREE.Vector3(),longest=0;
                    for(let i=0;i<positions.count;i++){const v=new THREE.Vector3().fromBufferAttribute(positions,i),radius=v.x*v.x+v.y*v.y;if(radius>longest){longest=radius;tip=v;}}
                    tip.applyQuaternion(h.object.quaternion);const angle=2*Math.PI*(seconds%h.period)/h.period;
                    if(new THREE.Vector2(tip.x,tip.y).normalize().dot(new THREE.Vector2(Math.sin(angle),Math.cos(angle)))<.99)throw Error('Clock hand direction '+h.name);
                }result.clock.push(iso);
            }
            const before=clock.hands[1].object.quaternion.clone();clock.update(Date.parse('2026-10-19T03:16:30Z'));
            result.clockAdvanced=before.angleTo(clock.hands[1].object.quaternion)>.1;
            result.blockedPathSamples=[];
            for(const [routeIndex,route] of villagePathRoutes().entries())for(let i=1;i<route.length;i++){
                const a=route[i-1],b=route[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/10);
                for(let j=0;j<=steps;j++){const x=a[0]+(b[0]-a[0])*j/steps,y=a[1]+(b[1]-a[1])*j/steps;
                    if(!p.canStand(x,y))result.blockedPathSamples.push({routeIndex,x,y});}
            }
            result.blockedPathCorners=[];
            for(const [routeIndex,route] of villagePathRoutes().entries())for(let i=1;i<route.length-1;i++){
                const a=route[i-1],b=route[i],c=route[i+1],before=Math.hypot(a[0]-b[0],a[1]-b[1]),after=Math.hypot(c[0]-b[0],c[1]-b[1]);
                if(!before||!after)continue;
                const radius=Math.min(100,before/2,after/2);
                const start=[b[0]+(a[0]-b[0])*radius/before,b[1]+(a[1]-b[1])*radius/before];
                const end=[b[0]+(c[0]-b[0])*radius/after,b[1]+(c[1]-b[1])*radius/after];
                for(let j=0;j<=20;j++){const t=j/20,q=1-t,x=q*q*start[0]+2*q*t*b[0]+t*t*end[0],y=q*q*start[1]+2*q*t*b[1]+t*t*end[1];
                    if(!p.canStand(x,y))result.blockedPathCorners.push({routeIndex,x,y});}
            }
            const step=20,key=(x,y)=>`${x},${y}`,start=[Math.round(TOWN_ARRIVAL.x/step),Math.round(TOWN_ARRIVAL.y/step)];
            const visited=new Set([key(...start)]),queue=[start];
            for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
                const nx=x+dx,ny=y+dy,k=key(nx,ny);
                if(nx<27||nx>149||ny<36||ny>124||visited.has(k)||!p.canStand(nx*step,ny*step))continue;
                visited.add(k);queue.push([nx,ny]);}}
            result.reachableEntrances=Object.fromEntries(TOWN_MODEL_BUILDINGS.map(d=>[d.id,
                visited.has(key(Math.round((d.x+(d.entranceOffsetX||0))/step),Math.round((d.y+70)/step)))]));
            result.informationClearance={furniture:gap('settlement_information','julian_furniture'),
                busStop:gap('settlement_information','village_bus_stop'),board:gap('settlement_information','plaza_notice_board')};
            result.roadObstructions=[];
            result.propBodies = TOWN_MODEL_PROPS.map(d => {
                const model = s.scene.getObjectByName(d.id);
                const bodies = s.collisionFootprints.filter(b => b.id === d.id && b.type === 'static');
                return { id: d.id, count: bodies.length,
                    solid: bodies.every(b => !p.canStand((b.minX+b.maxX)/2,(b.minY+b.maxY)/2)),
                    type: model.userData.rigidBody?.type };
            });
            const roadMin=TOWN_BUS_ROAD.centerY-TOWN_BUS_ROAD.width/2-TOWN_BUS_ROAD.shoulder;
            const roadMax=TOWN_BUS_ROAD.centerY+TOWN_BUS_ROAD.width/2+TOWN_BUS_ROAD.shoulder;
            for(const d of TOWN_MODEL_PROPS){
                const b=new THREE.Box3().setFromObject(s.scene.getObjectByName(d.id));
                if(b.min.z*.4383711467890774<roadMax&&b.max.z*.4383711467890774>roadMin)result.roadObstructions.push(d.id);
            }
            return result;
        });
        fs.writeFileSync(`${output}/${prefix}-checks.json`,JSON.stringify({...report,errors},null,2));
        assert.equal(Object.keys(report.buildings).length,9);
        for(const [id,v] of Object.entries(report.buildings)){
            assert(Math.abs(v.width-v.expected)<1,id+' width');assert(v.blocked,id+' collision');assert(v.frontClear,id+' front');
            if(v.doorHeight!==undefined)assert(Math.abs(v.doorHeight-125)<.1,id+' door height '+v.doorHeight);
            if(v.doorAlignment!==undefined)assert(v.doorAlignment<1,id+' door alignment');
        }
        assert.deepEqual(report.overlaps,[]);assert(report.clockAdvanced);assert.deepEqual(errors,[]);
        if(output.includes('rigidbody')) {
            assert(report.propBodies.every(b => b.type === 'static' && b.count > 0 && b.solid),
                'Every prop must have blocking fixed bodies');
        } else {
            assert.deepEqual(report.blockedPathSamples,[],'Walking paths must remain clear');
            assert.deepEqual(report.blockedPathCorners,[],'Rounded path corners must remain clear');
        }
        if(output.includes('road-clear'))assert.deepEqual(report.roadObstructions,[],'Carriageway and shoulders must have no props');
        assert(Object.values(report.reachableEntrances).every(Boolean),'Every entrance must be reachable from arrival');
        if(output.includes('information-building-spacing')){
            assert(report.informationClearance.furniture>150,'Furniture/information lawn gap');
            assert(report.informationClearance.busStop>150,'Bus stop/information lawn gap');
            assert(report.informationClearance.board>10,'Board must be separate from the information building');
        }
        const captures=await page.evaluate(async captureSky=>{
            const THREE=await import('/vendor/three/three.module.js');
            const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
            const s=window.stockWarsApp.townModelScene,result={};
            for(const {id} of TOWN_MODEL_BUILDINGS){
                const b=new THREE.Box3().setFromObject(s.scene.getObjectByName(id)),center=b.getCenter(new THREE.Vector3());
                const distance=Math.max(b.max.x-b.min.x,(b.max.y-b.min.y)*1.5)*2.1;
                s.camera.position.set(center.x+distance*.22,center.y+distance*.48,center.z+distance);
                s.camera.lookAt(center);s.landscape.update(center.x,center.z,s.town.playerController.renderPosition);s.renderer.render(s.scene,s.camera);
                result[id]=s.renderer.domElement.toDataURL('image/png');
            }
            const stopBounds=new THREE.Box3().setFromObject(s.scene.getObjectByName('village_bus_stop'));
            const stopCenter=stopBounds.getCenter(new THREE.Vector3()),stopWidth=stopBounds.max.x-stopBounds.min.x;
            stopCenter.y=stopBounds.min.y+(stopBounds.max.y-stopBounds.min.y)*.8;
            s.camera.position.set(stopCenter.x+stopWidth*.2,stopCenter.y+stopWidth*.65,stopCenter.z+stopWidth*1.5);
            s.camera.lookAt(stopCenter);s.landscape.update(stopCenter.x,stopCenter.z,s.town.playerController.renderPosition);
            s.renderer.render(s.scene,s.camera);result['bus-stop-upper']=s.renderer.domElement.toDataURL('image/png');
            const all=new THREE.Box3();
            for(const {id} of TOWN_MODEL_BUILDINGS)all.union(new THREE.Box3().setFromObject(s.scene.getObjectByName(id)));
            const center=all.getCenter(new THREE.Vector3());
            s.camera.position.set(center.x,center.y+4100,center.z+4500);
            s.camera.lookAt(center);s.landscape.update(center.x,center.z,s.town.playerController.renderPosition);
            s.renderer.render(s.scene,s.camera);result.overview=s.renderer.domElement.toDataURL('image/png');
            if(captureSky){
                const sky=s.landscape.sky,samples=[];
                const {townCloudPositions}=await import('/js/components/town3d/TownClouds.js');
                s.camera.position.set(center.x,center.y+4100,center.z+4500);
                s.camera.lookAt(center);s.landscape.update(center.x,center.z,s.town.playerController.renderPosition);
                const cloudStart=townCloudPositions(0),cloudLater=townCloudPositions(30);
                if(!cloudStart.every((c,i)=>cloudLater[i].x>c.x))throw Error('Clouds must drift right');
                if(JSON.stringify(townCloudPositions(0,true))!==JSON.stringify(townCloudPositions(1000,true)))throw Error('Reduced motion must freeze clouds');
                for(const c of townCloudPositions(100000))if(c.x < -c.width || c.x>1+c.width)throw Error('Cloud wrap bounds');
                for(const stage of ['dawn','day','sunset','night']){
                    s.scene.userData.skyTimeOfDay=stage;sky.update(performance.now(),true);
                    const still=sky.image.toDataURL();sky.update(performance.now()+30000,true);
                    if(still===sky.image.toDataURL())throw Error('Cloud pixels must move');
                    samples.push(sky.colors.join(','));s.renderer.render(s.scene,s.camera);
                    result[`sky-${stage}`]=s.renderer.domElement.toDataURL('image/png');
                }
                if(new Set(samples).size!==4)throw Error('Sky stages must differ');
                s.scene.userData.skyTimeOfDay='day';sky.update(performance.now(),true);
                const start=performance.now();s.scene.userData.skyTimeOfDay='night';sky.update(start);
                if(sky.colors.join(',')!==samples[1])throw Error('Transition must start from current colors');
                sky.update(start+6000);if([samples[1],samples[3]].includes(sky.colors.join(',')))throw Error('Missing intermediate sky colors');
                sky.update(start+12000);if(sky.colors.join(',')!==samples[3])throw Error('Transition did not finish');
                delete s.scene.userData.skyTimeOfDay;sky.update(performance.now(),true);
                s.scene.userData.skyTimeOfDay='day';
                const weather=s.landscape.weather;
                for(const [category,mode] of [['rain',1],['snow',2]]){
                    s.scene.userData.townWeather=category;sky.update(performance.now(),true);
                    weather.update(10000,true);s.renderer.render(s.scene,s.camera);
                    s.landscape.snow.update(10000,true);
                    if(weather.uniforms.mode.value!==mode||weather.uniforms.amount.value!==1||!weather.mesh.visible)throw Error('Missing precipitation '+category);
                    const before=s.renderer.domElement.toDataURL('image/png');
                    weather.update(11500,true);s.renderer.render(s.scene,s.camera);
                    result[`weather-${category}`]=s.renderer.domElement.toDataURL('image/png');
                    if(before===result[`weather-${category}`])throw Error('Precipitation must move '+category);
                }
                s.scene.userData.townWeather='clear';weather.update(12000,true);
                if(weather.mesh.visible)throw Error('Clear weather must hide precipitation');
                const snow=s.landscape.snow;
                s.scene.userData.townWeather='snow';snow.update(0,true);
                snow.amount.value=.3;snow.update(1000);const light=snow.amount.value;
                snow.update(6000);if(snow.amount.value<=light)throw Error('Snow must accumulate');
                s.scene.userData.townWeather='clear';const full=snow.amount.value;snow.update(11000);
                if(snow.amount.value>=full||snow.amount.value<=0)throw Error('Snow must melt gradually');
                snow.update(12000,true);if(snow.amount.value!==0)throw Error('Clear snow reset');
                delete s.scene.userData.townWeather;delete s.scene.userData.skyTimeOfDay;
                sky.update(performance.now(),true);
            }
            return result;
        },output.includes('sky')||output.includes('weather'));
        for(const [id,data] of Object.entries(captures))fs.writeFileSync(`${output}/${prefix}-${id}.png`,Buffer.from(data.split(',')[1],'base64'));
        await page.setViewportSize({width:900,height:700});await page.waitForTimeout(250);
        assert(await page.locator('.town-model-layer').isVisible());assert.deepEqual(errors,[]);
        if(output.includes('weather')){
            await page.emulateMedia({reducedMotion:'reduce'});
            await page.evaluate(()=>{
                const s=window.stockWarsApp.townModelScene,w=s.landscape.weather;
                s.scene.userData.townWeather='snow';w.update(20000,true);const before=w.uniforms.time.value;
                w.update(25000,true);if(w.uniforms.time.value!==before)throw Error('Reduced-motion precipitation must remain still');
                delete s.scene.userData.townWeather;
            });
        }
        console.log('PASS',prefix,JSON.stringify(report));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
