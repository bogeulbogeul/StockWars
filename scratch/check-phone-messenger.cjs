const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web'), out = path.resolve('output/messenger-app-game-v1');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const errors = [];
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
        await page.addInitScript(() => {
            window.settingsTestAudios = [];
            const Original = window.Audio;
            window.Audio = class extends Original { constructor(...args) { super(...args); window.settingsTestAudios.push(this); } };
        });
        const base = `http://127.0.0.1:${server.address().port}`;
        await page.goto(base + '/?demo=standard');
        await page.waitForFunction(() => window.stockWarsApp?.phoneHome);
        assert.equal(await page.locator('.town-music-toggle').count(), 0);
        const start = async () => {
            await page.getByRole('button', { name: '게임 시작', exact: true }).click();
            await page.locator('.opening-sequence__skip').click();
            await page.locator('.bus-arrival .opening-sequence__skip').click();
            await page.locator('.crayon-title').waitFor({ state: 'detached' });
        };
        await start();
        await page.evaluate(()=>window.stockWarsApp.phoneHome.open());
        await page.locator('[data-phone-app="messenger"]').click();
        assert.match(await page.locator('.messenger-offline').textContent(),/로컬 모드/);
        await page.locator('[data-action="add"]').click();
        await page.locator('[name="query"]').fill('친구');
        await page.getByRole('button',{name:'찾기',exact:true}).click();
        assert.match(await page.locator('[data-status]').textContent(),/서버/);
        await page.locator('.cozy-phone__back').click();
        await page.evaluate(()=>{
            window.stockWarsApp.isLocalSession=false;
            window.messengerCalls=[];
            const friends=[{id:101,name:'새봄'},{id:102,name:'잎새'}];
            const social={friends,incoming:[{id:103,name:'도담'}],outgoing:[]};
            const messages=window.messengerFixtureMessages=[{id:1,playerId:101,sender:'새봄',text:'광장에서 잠깐 만날까?',timestamp:Date.now()}];
            const room={id:'group_test',title:'산책 친구들',count:3,members:[100,101,102],lastMessage:messages[0]};
            let created=false;
            window.stockWarsChat={
                friends:async(op,id,options)=>{
                    window.messengerCalls.push(['friends',op,id,options]);
                    if(op==='search')return {players:[{id:104,name:'하루<script>'}]};
                    if(op==='request')social.outgoing.push({id,name:options.targetName});
                    if(op==='accept'){social.friends.push(social.incoming.shift());}
                    return structuredClone(social);
                },
                list:async()=>({rooms:created?[room]:[],playerId:100}),
                room:async(op,options)=>{
                    window.messengerCalls.push(['room',op,options]);
                    if(op==='create'){if(!options.members.every(Number.isInteger))return{error:'참여자를 다시 확인해 주세요.'};created=true;room.title=options.title;return{roomId:room.id};}
                    if(op==='send'){messages.push({id:messages.length+1,playerId:100,sender:'나',text:options.text,timestamp:Date.now()});room.lastMessage=messages.at(-1);}
                    return{messages:structuredClone(messages),playerId:100};
                }
            };
        });
        await page.locator('[data-phone-app="messenger"]').click();
        await page.waitForFunction(()=>!document.querySelector('.messenger-offline')?.checkVisibility());
        await page.locator('[data-action="add"]').click();
        await page.locator('[name="query"]').fill('하루');
        await page.getByRole('button',{name:'찾기',exact:true}).click();
        await page.locator('[data-request]').click();
        assert.match(await page.locator('[data-request]').textContent(),/수락 대기/);
        assert.equal(await page.locator('.phone-messenger script').count(),0);
        await page.locator('[data-accept]').click();
        assert.equal(await page.locator('[data-accept]').count(),0);
        await page.screenshot({path:path.join(out,prefix+'-friends.png')});
        await page.locator('[data-action="list"]').click();
        await page.locator('[data-action="create"]').click();
        assert.equal(await page.locator('[data-create]').isDisabled(),true);
        await page.locator('[name="title"]').fill('광장 산책 친구들');
        await page.getByRole('checkbox',{name:'새봄 선택'}).check();
        await page.getByRole('checkbox',{name:'잎새 선택'}).check();
        await page.screenshot({path:path.join(out,prefix+'-create.png')});
        await page.locator('[data-create]').click();
        await page.locator('[name="text"]').fill('좋아! 곧 갈게. <img src=x onerror=alert(1)>');
        await page.getByRole('button',{name:'보내기',exact:true}).click();
        assert.match(await page.locator('.messenger-message.mine').textContent(),/곧 갈게/);
        assert.equal(await page.locator('.messenger-message img').count(),0);
        await page.evaluate(()=>{window.messengerFixtureMessages.at(-1).text='좋아! 곧 갈게.';});
        await page.waitForFunction(()=>!document.querySelector('.messenger-message.mine')?.textContent.includes('<img'));
        await page.screenshot({path:path.join(out,prefix+'-chat.png')});
        await page.locator('[data-action="list"]').click();
        await page.waitForFunction(()=>document.querySelector('[data-room]'));
        await page.screenshot({path:path.join(out,prefix+'-list.png')});
        await page.setViewportSize({width:390,height:844});
        await page.locator('[data-room]').click();
        await page.screenshot({path:path.join(out,prefix+'-mobile.png')});
        await page.locator('.cozy-phone__back').click();
        assert.equal(await page.locator('.cozy-phone__home').isVisible(),true);
        const calls=await page.evaluate(()=>window.messengerCalls);
        assert(calls.some(c=>c[0]==='room'&&c[1]==='create'&&c[2].members.length===2));
        assert(calls.some(c=>c[0]==='room'&&c[1]==='send'));
        const {PresenceRegistry}=await import('../Server/presence/registry.mjs');
        const registry=new PresenceRegistry(), self=registry.session(), peer=registry.session();
        registry.update(self.token,'nickname',undefined,{nickname:'테스트소망'});
        registry.update(peer.token,'nickname',undefined,{nickname:'테스트새봄'});
        await page.exposeFunction('messengerRegistry', (method,...args)=>{
            try {
                if(method==='friends'){const [operation,targetId,options]=args;return registry.chat(self.token,'friends',undefined,{...options,operation,targetId});}
                if(method==='list')return registry.chat(self.token,'list');
                const [action,options]=args;return registry.chat(self.token,action,options?.text,options);
            }catch(e){return{error:e.message};}
        });
        await page.evaluate(()=>{window.stockWarsChat={friends:(...args)=>window.messengerRegistry('friends',...args),list:()=>window.messengerRegistry('list'),room:(...args)=>window.messengerRegistry('room',...args)};});
        await page.locator('[data-phone-app="messenger"]').click();
        await page.locator('[data-action="add"]').click();
        await page.locator('[name="query"]').fill('테스트새봄');
        await page.getByRole('button',{name:'찾기',exact:true}).click();
        await page.locator('[data-request]').click();
        assert.equal(registry.chat(peer.token,'friends',undefined,{operation:'list'}).incoming.length,1);
        registry.chat(peer.token,'friends',undefined,{operation:'accept',targetId:self.playerId});
        await page.waitForTimeout(3200);
        await page.locator('[data-action="list"]').click();
        await page.locator('[data-action="create"]').click();
        await page.getByRole('checkbox',{name:'테스트새봄 선택'}).check();
        await page.locator('[data-create]').click();
        await page.locator('[name="text"]').fill('실제 서버 규칙으로 보낸 메시지');
        await page.getByRole('button',{name:'보내기',exact:true}).click();
        const actualRoom=registry.chat(peer.token,'list').rooms[0];
        assert.equal(registry.chat(peer.token,'list',undefined,{roomId:actualRoom.id}).messages.at(-1).text,'실제 서버 규칙으로 보낸 메시지');
        registry.chat(peer.token,'send','답장이 도착했어!',{roomId:actualRoom.id});
        await page.waitForFunction(()=>document.querySelector('.messenger-messages')?.textContent.includes('답장이 도착했어!'));
        await page.locator('.cozy-phone__back').click();
        assert.deepEqual(errors,[]);
        fs.writeFileSync(path.join(out,prefix+'-checks.json'),JSON.stringify({realRegistryRoundTrip:true,offlineExplained:true,search:true,request:true,accept:true,create:true,send:true,escaped:true,mobile:true,home:true,errors},null,2));
        console.log(prefix+' messenger checks passed with isolated bridge fixture');
    } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
