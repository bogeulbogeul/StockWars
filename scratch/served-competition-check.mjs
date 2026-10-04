import {MarketEngine} from '../engine/marketEngine.js';
import {FriendManager} from '../engine/FriendManager.js';
import {CipherTrainingRoom} from './CipherTrainingRoom.js';

export function validArenaStake(cash,stake){
    return Number.isSafeInteger(stake)&&stake%100===0&&(stake===0||(stake>=cash*.01&&stake<=cash*.1));
}
async function arenaPasswordHash(password){
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password));
    return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}

export class CipherCompetitionRoom{
    constructor(container){
        this.container=container;this.friends=new FriendManager();this.rooms=[];
        try{this.rooms=JSON.parse(localStorage.getItem('stockwars.competition.rooms')||'[]').filter(r=>r&&typeof r.name==='string'&&[3,5,10].includes(r.minutes)&&[10000,100000,1000000].includes(r.cash)).slice(0,12);}catch{}
        this.dialog=document.createElement('dialog');this.dialog.className='cipher-training cipher-arena';this.dialog.setAttribute('aria-label','모의투자 대결 로비');container.append(this.dialog);
        this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();});
        if(!document.getElementById('cipher-arena-style')){
            const style=document.createElement('style');style.id='cipher-arena-style';style.textContent=`
            .cipher-arena{background:radial-gradient(ellipse at 75% 0%,#173650 0%,#081221 60%)}
            .cipher-arena header{padding:10px 6px 22px}.cipher-arena header h2{font-size:30px;letter-spacing:-1px}
            .cipher-arena>p{margin:0;padding:16px 20px;background:linear-gradient(90deg,#1b3448,#142337);border-left:3px solid #f2c65c;border-radius:8px;color:#b5c9da;line-height:1.6}
            .cipher-arena .training-workspace{gap:24px;grid-template-columns:minmax(0,1.4fr) minmax(280px,.8fr)!important}
            .cipher-arena .training-workspace>main,.cipher-arena .training-workspace>aside{background:#101f30e8;border-color:#2a4054;padding:24px;border-radius:18px}
            .cipher-arena h3{color:#f2d390;font-size:17px;margin:8px 0 18px}.cipher-arena [data-rooms]>section{background:linear-gradient(120deg,#20374b,#122235);border-color:#456075!important;box-shadow:0 8px 20px #0002}
            .cipher-arena [data-rooms] p{color:#a8c4d9;line-height:1.8}.cipher-arena form[data-create]{display:grid;grid-template-columns:1fr 1fr;gap:16px}.cipher-arena form label{display:flex;flex-direction:column;gap:7px;font-size:13px;color:#a8bfd1}.cipher-arena form label:first-child{grid-column:1/-1}.cipher-arena input,.cipher-arena select{margin:0!important;min-height:44px}.cipher-arena small{font-size:11px;letter-spacing:0;color:#7e9bad}.cipher-arena form button{grid-column:1/-1;background:linear-gradient(135deg,#e5c267,#bd923b);border-color:#e7c970;color:#102234;font-weight:800;min-height:46px}.cipher-arena [data-rooms] button:first-of-type{background:#236074;border-color:#40889b}.cipher-arena [data-friend]{display:flex;gap:10px}.cipher-arena [data-friend] input{flex:1;min-width:0}.cipher-arena [data-friend] button{white-space:nowrap}.cipher-arena [data-friends] p{background:#182b3d;padding:14px;border-radius:9px}.cipher-arena button:hover{filter:brightness(1.13)}
            @media(max-width:760px){.cipher-arena .training-workspace{grid-template-columns:1fr!important}.cipher-arena form[data-create]{grid-template-columns:1fr}.cipher-arena .training-workspace>aside{grid-column:auto}}`;
            document.head.append(style);
        }
    }
    open(){this.dialog.showModal();this.render();}
    close(){this.dialog.close();this.onClose?.();}
    save(){try{localStorage.setItem('stockwars.competition.rooms',JSON.stringify(this.rooms));}catch{}}
    render(){
        this.dialog.innerHTML='<header><div><small>CIPHER ARENA</small><h2>모의투자 대결</h2></div><button data-exit>로비로 돌아가기 · Esc</button></header><p>같은 시작 자금, 같은 시장. 제한 시간 종료 시 총자산으로 순위를 결정합니다.</p><div class="training-workspace" style="grid-template-columns:1fr 1fr"><main><h3>게임 로비 · 내 방</h3><div data-rooms></div><h3>방 만들기</h3><form data-create><label>방 이름<input name="name" maxlength="40" required placeholder="함께 투자해요"></label><label>대결 시간<select name="minutes"><option value="3">3분</option><option value="5" selected>5분</option><option value="10">10분</option></select></label><label>시작 자금<select name="cash"><option value="10000">10,000G</option><option value="100000" selected>100,000G</option><option value="1000000">1,000,000G</option></select></label><label>배팅 금액 (G)<input name="stake" type="number" min="0" max="1000000" step="100" value="0" required><small>0G는 무료 대결 · 로컬 대결용 가상 배팅</small></label><label>방 공개 설정<select name="access"><option value="open">공개방</option><option value="locked">비밀번호방</option></select></label><label data-password-label style="display:none">방 비밀번호<input name="password" type="password" minlength="4" maxlength="32" autocomplete="new-password" placeholder="4~32자"></label><button>방 만들기</button></form></main><aside><h3>친구</h3><form data-friend><input name="name" maxlength="40" required placeholder="친구 닉네임" aria-label="친구 닉네임"><button>친구 추가</button></form><p role="status" data-status></p><div data-friends></div><p style="color:#90a8bd">현재는 로컬 대결 버전입니다. 친구 등록은 기존 친구 목록과 공유하며, 온라인 초대 전송과 다른 사용자 접속은 아직 연결되지 않았습니다.</p></aside></div>';
        this.dialog.querySelector('[data-exit]').onclick=()=>this.close();
        const stakeInput=this.dialog.querySelector('[name=stake]'),cashSelect=this.dialog.querySelector('[name=cash]');
        const access=this.dialog.querySelector('[name=access]'),password=this.dialog.querySelector('[name=password]');
        access.onchange=()=>{const locked=access.value==='locked';password.required=locked;this.dialog.querySelector('[data-password-label]').style.display=locked?'flex':'none';if(!locked)password.value='';};
        const updateStake=()=>{
            const cash=Number(cashSelect.value);stakeInput.max=String(cash*.1);stakeInput.value=String(cash*.05);
            stakeInput.setCustomValidity('');
            stakeInput.nextElementSibling.textContent=`무료 0G · 유료 ${(cash*.01).toLocaleString()}~${(cash*.1).toLocaleString()}G · 기본 5%`;
        };
        const validateStake=()=>{stakeInput.setCustomValidity(validArenaStake(Number(cashSelect.value),Number(stakeInput.value))?'':'0G 또는 시작 자금의 1~10%를 100G 단위로 입력해 주세요.');};
        cashSelect.onchange=updateStake;stakeInput.oninput=validateStake;updateStake();
        this.dialog.querySelector('[data-create]').onsubmit=async e=>{
            e.preventDefault();if(this.rooms.length>=12){this.dialog.querySelector('[data-status]').textContent='방은 최대 12개까지 만들 수 있습니다.';return;}
            const data=new FormData(e.target),name=String(data.get('name')).trim();if(!name)return;
            const stake=Number(data.get('stake'));if(!validArenaStake(Number(data.get('cash')),stake)){validateStake();stakeInput.reportValidity();return;}
            const passwordHash=data.get('access')==='locked'?await arenaPasswordHash(String(data.get('password'))):null;
            this.rooms.push({passwordHash,stake,id:crypto.randomUUID(),name,minutes:Number(data.get('minutes')),cash:Number(data.get('cash')),invited:[]});this.save();this.render();
        };
        this.dialog.querySelector('[data-friend]').onsubmit=e=>{e.preventDefault();const result=this.friends.addFriendByName(new FormData(e.target).get('name'));this.render();this.dialog.querySelector('[data-status]').textContent=result.message;};
        for(const room of this.rooms){
            const card=document.createElement('section');card.style.cssText='padding:16px;margin:12px 0;border:1px solid #344e68;border-radius:12px';
            const title=document.createElement('h3');title.textContent=room.name;const info=document.createElement('p');info.textContent=`${room.passwordHash?'🔒 비밀번호방':'공개방'} · ${room.minutes}분 · ${room.cash.toLocaleString()}G · 배팅 ${(room.stake||0).toLocaleString()}G · 참가자 나 + AI`;
            const start=document.createElement('button');start.textContent='방 참가하기';start.onclick=()=>this.requestJoin(room);
            const remove=document.createElement('button');remove.textContent='방 삭제';remove.style.marginLeft='8px';remove.onclick=()=>{this.rooms=this.rooms.filter(r=>r.id!==room.id);this.save();this.render();};card.append(title,info,start,remove);this.dialog.querySelector('[data-rooms]').append(card);
        }
        if(!this.rooms.length)this.dialog.querySelector('[data-rooms]').textContent='아직 방이 없습니다. 첫 대결 방을 만들어 보세요.';
        for(const friend of this.friends.getFriends()){
            const row=document.createElement('p');row.textContent=`👤 ${friend.name} · 오프라인`;this.dialog.querySelector('[data-friends]').append(row);
        }
    }
    requestJoin(room){
        if(!room.passwordHash){this.join(room);return;}
        this.render();
        const form=document.createElement('form');form.style.cssText='padding:20px;border:1px solid #d5b461;border-radius:12px;margin-bottom:16px';
        const title=document.createElement('h3');title.textContent=`🔒 ${room.name}`;
        const input=document.createElement('input');input.type='password';input.required=true;input.maxLength=32;input.autocomplete='off';input.placeholder='방 비밀번호';input.setAttribute('aria-label','참가 비밀번호');
        const error=document.createElement('p');error.setAttribute('role','status');
        const enter=document.createElement('button');enter.textContent='확인하고 참가';
        const cancel=document.createElement('button');cancel.type='button';cancel.textContent='취소';cancel.onclick=()=>this.render();
        form.append(title,input,error,enter,cancel);this.dialog.querySelector('[data-rooms]').prepend(form);
        form.onsubmit=async e=>{e.preventDefault();enter.disabled=true;try{if(await arenaPasswordHash(input.value)===room.passwordHash)this.join(room);else{error.textContent='비밀번호가 일치하지 않습니다.';input.focus();}}finally{enter.disabled=false;}};
        input.focus();
    }
    join(room){
        this.render();
        const waiting=document.createElement('section');waiting.style.cssText='padding:24px;border:1px solid #d5b461;border-radius:14px;background:#152d40;margin-bottom:20px';
        const title=document.createElement('h3');title.textContent=`${room.name} · 참가 완료`;
        const details=document.createElement('p');details.textContent=`대결 ${room.minutes}분 · 시작 자금 ${room.cash.toLocaleString()}G · 배팅 ${(room.stake||0).toLocaleString()}G`;
        const players=document.createElement('p');players.textContent='참가자: 나 · AI 상대 준비 완료';
        const start=document.createElement('button');start.textContent='대결 시작';start.onclick=()=>this.start(room);
        const leave=document.createElement('button');leave.textContent='방 나가기';leave.style.marginLeft='10px';leave.onclick=()=>this.render();
        waiting.append(title,details,players,start,leave);
        this.dialog.querySelector('[data-rooms]').prepend(waiting);
        start.focus();
    }
    start(room){
        if(!validArenaStake(room.cash,room.stake||0)){this.dialog.querySelector('[data-status]').textContent='이 방의 배팅 금액이 새 범위를 벗어납니다. 방을 다시 만들어 주세요.';return;}
        const engine=new MarketEngine();engine.cash=engine.initialCash=room.cash;
        const bot={cash:room.cash,positions:new Map()};
        this.match?.dialog.remove();const match=new CipherTrainingRoom(this.container,engine);this.match=match;
        match.dialog.querySelector('h2').textContent=room.name;
        match.dialog.querySelector('[data-close]').textContent='대결 포기';
        const status=document.createElement('p');status.style.color='#f5d583';match.dialog.querySelector('header').after(status);
        const deadline=Date.now()+room.minutes*60000;let finished=false;
        const botAssets=()=>bot.cash+[...bot.positions].reduce((sum,[id,qty])=>sum+(engine.stocks.get(id)?.price||0)*qty,0);
        const finish=(quit=false)=>{
            if(finished)return;finished=true;clearInterval(timer);engine.stopEngine();
            match.dialog.querySelector('[data-buy]').disabled=true;match.dialog.querySelector('[data-sell]').disabled=true;
            const mine=engine.getState().totalNetWorth,other=botAssets();
            status.textContent=quit?'대결을 포기했습니다.':`대결 종료 · ${mine>other?'1위 나':mine<other?'1위 AI':'공동 1위'} · 내 총자산 ${Math.round(mine).toLocaleString()}G · AI ${Math.round(other).toLocaleString()}G`;
            match.dialog.querySelector('[data-close]').textContent='대결 로비로 돌아가기';
        };
        match.onClose=()=>{finish(true);this.render();};
        match.order=side=>{if(!finished)CipherTrainingRoom.prototype.order.call(match,side);};
        const timer=setInterval(()=>{
            const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(!remaining){finish();return;}
            status.textContent=`남은 시간 ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} · 내 자산 ${Math.round(engine.getState().totalNetWorth).toLocaleString()}G · AI ${Math.round(botAssets()).toLocaleString()}G`;
            if(remaining%5===0){const stocks=[...engine.stocks.values()],stock=stocks[Math.floor(Math.random()*stocks.length)];if(Math.random()<.6){const qty=Math.floor(bot.cash*.15/stock.price);if(qty>0){bot.cash-=qty*stock.price;bot.positions.set(stock.id,(bot.positions.get(stock.id)||0)+qty);}}else{const holding=[...bot.positions][0];if(holding){bot.cash+=engine.stocks.get(holding[0]).price*holding[1];bot.positions.delete(holding[0]);}}}
        },1000);
        engine.startEngine();match.open();
    }
}



