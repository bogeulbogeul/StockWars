import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const initialStocks = JSON.parse(fs.readFileSync(new URL('./arena-stocks.json', import.meta.url), 'utf8'));
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export class OnlineArena {
    constructor(registry) { this.registry = registry; this.rooms = new Map(); this.completed = new Map(); }
    name(token) { return [...this.registry.names.values()].find(n => n.token === token)?.nickname || '트레이더'; }
    online(token) { const s = this.registry.sessions.get(token); return !!s?.active && this.registry.now() - s.seen < this.registry.timeoutMs; }
    persistResults(room) {
        const results = [...room.members].map(([owner, p]) => ({ owner, name: this.name(owner), assets: this.assets(room,p), forfeited: !!p.forfeited })).sort((a,b) => Number(a.forfeited)-Number(b.forfeited) || b.assets-a.assets);
        let rank=1; results.forEach((p,i) => { if(i && (p.assets!==results[i-1].assets || p.forfeited!==results[i-1].forfeited)) rank=i+1; p.rank=rank; });
        room.results = results;
        this.registry.social.arenaResults = [...(this.registry.social.arenaResults || []), { id: room.id, name: room.name, ended: room.deadline, cash: room.cash, results }].slice(-1000);
        if(this.registry.nameFile) {
            const file=`${this.registry.nameFile}.social`;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(`${file}.tmp`,JSON.stringify(this.registry.social),{mode:0o600});fs.renameSync(`${file}.tmp`,file);
        }
    }
    advance(room) {
        if(room.phase!=='running') return;
        const now=Math.min(this.registry.now(),room.deadline), steps=Math.floor((now-room.started)/2000);
        while(room.step<steps) {
            room.step++;
            room.stocks.forEach((s,i)=> {s.prevPrice=s.price;s.price=Math.max(10,Math.round(s.price*(1+Math.sin(room.seed+room.step*1.7+i*.9)*.003)));const h=room.histories[s.id];h.push(s.price);if(h.length>50)h.shift();});
            if(room.step%15===0) {
                const s=room.stocks[room.step%room.stocks.length], positive=room.step%30===0;
                s.price=Math.max(10,Math.round(s.price*(positive?1.025:.975)));
                const event={id:`news-${room.step}`,stockId:s.id,title:positive?'신규 계약 발표 · 매수세 유입':'실적 전망 하향 · 투자 심리 위축',content:positive?'시장에 신규 계약 체결 소식이 전해졌습니다.':'비용 증가와 실적 우려가 제기됐습니다.',time:room.started+room.step*2000};
                room.news.unshift(event);room.news=room.news.slice(0,20);
            }
        }
        if(this.registry.now()>=room.deadline) { room.phase='finished';this.persistResults(room); const snapshots=new Map([...room.members.keys()].map(token=>[token,this.state(room,token)])); this.completed.set(room.id,{snapshots,expires:this.registry.now()+300000}); this.rooms.delete(room.id); }
    }
    sweep() { for(const [id,r] of this.rooms) {this.advance(r);if(this.registry.now()-r.updated>1800000)this.rooms.delete(id);} for(const [id,r] of this.completed)if(this.registry.now()>=r.expires)this.completed.delete(id); }
    assets(room,p) { return p.cash + [...p.positions].reduce((sum,[id,v])=>sum+(room.stocks.find(s=>s.id===id)?.price||0)*v.qty,0); }
    publicRoom(room) { return { id:room.id,name:room.name,host:this.name(room.owner),minutes:room.minutes,cash:room.cash,stake:room.stake,locked:!!room.passwordHash,online:true,phase:room.phase,count:room.members.size }; }
    state(room,token) {
        this.advance(room);
        const p=room.members.get(token); if(!p)fail('참가 중인 방이 아닙니다.',403);
        const members=[...room.members].map(([owner,value])=>({name:this.name(owner),isOwn:owner===token,isHost:owner===room.owner,ready:value.ready,online:this.online(owner),assets:room.phase==='waiting'?room.cash:this.assets(room,value),forfeited:!!value.forfeited}));
        const portfolio=[...p.positions].map(([id,v])=>{const stock=room.stocks.find(s=>s.id===id);return {id,qty:v.qty,avgPrice:v.avgPrice,stock,leverage:1,isShort:false,collateral:v.avgPrice*v.qty,currentVal:stock.price*v.qty,profitLoss:(stock.price-v.avgPrice)*v.qty,profitLossPct:(stock.price/v.avgPrice-1)*100};});
        const totalNetWorth=this.assets(room,p),portfolioValue=totalNetWorth-p.cash;
        return {room:this.publicRoom(room),members,isHost:room.owner===token,phase:room.phase,started:room.started,deadline:room.deadline,remaining:Math.max(0,Math.ceil((room.deadline-this.registry.now())/1000)),histories:room.histories,results:room.results?.map(({owner,...r})=>({...r,isOwn:owner===token})), market:{day:1,maxDays:10,cash:p.cash,initialCash:room.cash,targetRent:0,stocks:room.stocks,news:room.news,portfolio,portfolioValue,totalNetWorth,totalProfitLoss:portfolio.reduce((sum,v)=>sum+v.profitLoss,0),cipherIndex:{val:1000,diffPct:0,unit:'pts'},isLevel10Unlocked:false}};
    }
    handle(token,input) {
        const session=this.registry.sessions.get(token);if(!session)fail('세션을 다시 연결해 주세요.',401);session.seen=this.registry.now();session.active=true;
        this.sweep();
        const action=input.action;
        if(action==='list'||action==='find') {
            const query=String(input.query||'').trim().toLowerCase();if(action==='find'&&!query)fail('방 이름이나 코드를 입력해 주세요.');
            return { rooms:[...this.rooms.values()].filter(r=>r.phase==='waiting'&&(action==='find'?`${r.id} ${r.name} ${this.name(r.owner)}`.toLowerCase().includes(query):!r.passwordHash)&&(!r.passwordHash||r.id.toLowerCase()===query||r.members.has(token))).map(r=>this.publicRoom(r)), invitations:[...this.rooms.values()].filter(r=>r.phase==='waiting'&&r.invited.has(token)&&!r.members.has(token)).map(r=>this.publicRoom(r)), ownRooms:[...this.rooms.values()].filter(r=>r.members.has(token)).map(r=>this.publicRoom(r)) };
        }
        if(action==='create') {
            const r=input.room;
            if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>40||![3,5,10].includes(r.minutes)||![10000,100000,1000000].includes(r.cash)||!Number.isSafeInteger(r.stake)||!(r.stake===0||(r.stake>=r.cash*.01&&r.stake<=r.cash*.1&&r.stake%100===0))|| (r.passwordHash&&!/^[a-f0-9]{64}$/.test(r.passwordHash)))fail('방 설정을 확인해 주세요.');
            if(this.rooms.size>=100||[...this.rooms.values()].filter(r=>r.owner===token&&r.phase==='waiting').length>=3)fail('만들 수 있는 방 수를 초과했습니다.');
            const room={...r,id:randomUUID(),name:r.name.trim(),owner:token,members:new Map([[token,{cash:r.cash,positions:new Map(),ready:false,fills:new Map()}]]),invited:new Set(),phase:'waiting',updated:this.registry.now(),stocks:initialStocks.map(s=>({...s})),histories:Object.fromEntries(initialStocks.map(s=>[s.id,[s.price]])),news:[],step:0,seed:Math.random()*100};this.rooms.set(room.id,room);return this.state(room,token);
        }
        const completed=this.completed.get(input.id);if(completed){if(!completed.snapshots.has(token))fail('참가 중인 방이 아닙니다.',403);if(action==='state')return completed.snapshots.get(token);if(action==='leave'){completed.snapshots.delete(token);if(!completed.snapshots.size)this.completed.delete(input.id);return {success:true};}fail('거래 가능한 대결이 아닙니다.');} const room=this.rooms.get(input.id);if(!room)fail('방이 종료되었거나 서버가 재시작됐습니다.',404);room.updated=this.registry.now();
        if(action==='join') {
            if(room.members.has(token))return this.state(room,token);
            if(room.phase!=='waiting'||room.members.size>=8)fail('입장할 수 없는 방입니다.');
            if(room.passwordHash&&!room.invited.has(token)&&room.passwordHash!==input.passwordHash)fail('비밀번호가 일치하지 않습니다.',403);
            room.members.set(token,{cash:room.cash,positions:new Map(),ready:false,fills:new Map()});return this.state(room,token);
        }
        if(!room.members.has(token))fail('참가 중인 방이 아닙니다.',403);
        if(action==='state')return this.state(room,token);
        if(action==='invite') {
            if(room.owner!==token||room.phase!=='waiting')fail('방장만 대기실에서 초대할 수 있습니다.',403);
            const friend=[...this.registry.names.values()].find(n=>n.nickname===input.targetName)?.token;
            if(!friend||!this.registry.social.friendships.some(pair=>pair.includes(token)&&pair.includes(friend)))fail('등록된 친구만 초대할 수 있습니다.');
            if(!this.online(friend))fail('친구가 오프라인입니다.');room.invited.add(friend);return {success:true};
        }
        const p=room.members.get(token);
        if(action==='leave') {
            if(room.phase==='waiting'){room.members.delete(token);if(!room.members.size){this.rooms.delete(room.id);return {success:true};}if(room.owner===token)room.owner=room.members.keys().next().value;} else {p.forfeited=true;p.ready=false;}
            return {success:true};
        }
        if(action==='ready') {if(room.phase!=='waiting')fail('이미 시작된 대결입니다.');p.ready=input.ready===true;return this.state(room,token);}
        if(action==='start') {
            if(room.owner!==token)fail('방장만 시작할 수 있습니다.',403);
            if(room.phase!=='waiting'||room.members.size<2||[...room.members].some(([t,p])=>!p.ready||!this.online(t)))fail('2명 이상 접속하고 모두 준비해야 합니다.');
            room.phase='running';room.started=this.registry.now();room.deadline=room.started+room.minutes*60000;return this.state(room,token);
        }
        if(action==='trade') {
            if(typeof input.requestId!=='string'||! /^[a-zA-Z0-9-]{8,80}$/.test(input.requestId))fail('주문 번호를 확인해 주세요.');
            if(p.fills.has(input.requestId))return {...this.state(room,token),trade:p.fills.get(input.requestId)};
            this.advance(room);if(room.phase!=='running'||p.forfeited)fail('거래 가능한 대결이 아닙니다.');
            const stock=room.stocks.find(s=>s.id===input.stockId),qty=input.quantity;
            if(!stock||!Number.isSafeInteger(qty)||qty<1||qty>1000000||!['buy','sell'].includes(input.side))fail('주문을 확인해 주세요.');
            const holding=p.positions.get(stock.id);
            if(input.side==='buy'){const cost=stock.price*qty;if(cost>p.cash)fail('가상 자금이 부족합니다.');p.cash-=cost;const old=holding?.qty||0;p.positions.set(stock.id,{qty:old+qty,avgPrice:((holding?.avgPrice||0)*old+cost)/(old+qty)});}else{if(!holding||holding.qty<qty)fail('보유 수량이 부족합니다.');p.cash+=stock.price*qty;holding.qty-=qty;if(!holding.qty)p.positions.delete(stock.id);}
            const trade={success:true,price:stock.price,quantity:qty,side:input.side};p.fills.set(input.requestId,trade);return {...this.state(room,token),trade};
        }
        fail('잘못된 대결 요청입니다.');
    }
}