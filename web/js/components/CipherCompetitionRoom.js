import {MarketEngine} from '../engine/marketEngine.js';
import {FriendManager} from '../engine/FriendManager.js';
import {CipherTrainingRoom} from './CipherTrainingRoom.js';
import {installOnlineCompetition} from './OnlineCompetition.js';

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
            .cipher-arena .training-workspace{grid-template-columns:minmax(240px,1fr) minmax(320px,1.35fr) minmax(220px,.75fr)!important}
            .cipher-arena .arena-public-sidebar{display:flex;flex-direction:column;min-height:0;overflow:hidden}
            .cipher-arena .arena-public-sidebar>section:last-child{flex:1;min-height:0;overflow:auto}
            .cipher-arena .arena-public-sidebar [data-find-results]{max-height:180px;overflow:auto}
            @media(max-width:1100px){.cipher-arena .training-workspace{grid-template-columns:minmax(220px,1fr) minmax(300px,1.35fr)!important}.cipher-arena .training-workspace>aside:last-child{grid-column:1/-1}}
            @media(max-width:760px){.cipher-arena .training-workspace{grid-template-columns:1fr!important}.cipher-arena form[data-create]{grid-template-columns:1fr}.cipher-arena .training-workspace>aside{grid-column:auto}.cipher-arena .arena-public-sidebar>section:last-child{max-height:300px;flex:none}}`;
            document.head.append(style);
        }
    }
    open(){this.dialog.showModal();this.render();this.refreshPublicRooms();this.publicTimer=setInterval(()=>this.refreshPublicRooms(),15000);if(!localStorage.getItem('stockwars.arena.k-tutorial.v1'))this.startTutorial();}
    close(){clearInterval(this.publicTimer);this.dialog.close();this.onClose?.();}
    save(){try{localStorage.setItem('stockwars.competition.rooms',JSON.stringify(this.rooms));}catch{}if(this.dialog.open)this.refreshPublicRooms();}
    createNewsPanel(match){
        const panel=document.createElement('section');panel.className='arena-news-panel';
        panel.style.cssText='margin-top:24px;padding:16px;border:1px solid #355e73;border-top:3px solid #40d8cf;border-radius:12px;background:#102638';
        panel.innerHTML='<h3 style="margin:0 0 8px;color:#40d8cf">CIPHER NEWS</h3><small style="letter-spacing:0;color:#a8c4d9">가상 시장 뉴스 · 관련 종목을 눌러 차트 보기</small><p data-news-status role="status" aria-live="polite" style="color:#a8c4d9">시장 개장 · 첫 뉴스를 기다리고 있습니다.</p><div data-news-history style="max-height:380px;overflow-y:auto;overscroll-behavior:contain"></div>';
        match.dialog.querySelector('.training-order').append(panel);
        const bar=document.createElement('details');bar.className='arena-latest-news';
        bar.style.cssText='position:sticky;top:0;z-index:6;margin:18px 0 0;padding:12px 16px;border:1px solid #40d8cf;border-radius:10px;background:#102b3b;box-shadow:0 4px 16px #0005';
        const headline=document.createElement('summary');headline.textContent='CIPHER NEWS · 첫 뉴스를 기다리고 있습니다.';headline.style.cssText='cursor:pointer;font-weight:700;line-height:1.6;color:#bcefe9';headline.setAttribute('aria-live','polite');
        const content=document.createElement('p');content.style.cssText='line-height:1.7;color:#b4cad9;margin:12px 0';
        const jump=document.createElement('button');jump.textContent='관련 종목 차트 보기 →';jump.hidden=true;jump.style.cssText='color:#6de3d9';
        bar.append(headline,content,jump);match.dialog.querySelector('.training-chart').before(bar);
        panel.latestBar={bar,headline,content,jump};return panel;
    }
    addNewsCard(match,panel,{stock,title,detail,time,sector=false,example=false,breaking=false}){
        const card=document.createElement('article');card.style.cssText='margin-top:12px;padding:14px;background:#0b1b2b;border:1px solid #345266;border-radius:10px';
        const stamp=document.createElement('small');stamp.textContent=`${example?'튜토리얼 예시':time} · ${breaking?'속보 · ':''}${sector?'업종 뉴스':'종목 뉴스'}`;stamp.style.cssText=`color:${breaking?'#ffd875':'#8eafc4'};letter-spacing:0`;
        const heading=document.createElement('p');heading.textContent=title;heading.style.cssText='font-weight:700;line-height:1.6;margin:8px 0';
        const text=document.createElement('p');text.textContent=detail;text.style.cssText='font-size:13px;color:#a8c4d9;line-height:1.6;margin:8px 0';
        const link=document.createElement('button');link.textContent=`${stock.name} · 차트 보기 →`;link.style.cssText='width:100%;font-size:13px;color:#6de3d9';link.onclick=()=>{match.selected=stock.id;match.render();match.dialog.querySelector('.training-chart').scrollIntoView({behavior:'smooth',block:'center'});};
        card.append(stamp,heading,text,link);const list=panel.querySelector('[data-news-history]');list.prepend(card);while(list.children.length>10)list.lastElementChild.remove();list.scrollTop=0;
        if(!example){card.style.borderColor=breaking?'#e5bb59':'#40d8cf';if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)card.animate([{boxShadow:'0 0 18px #40d8cf60'},{boxShadow:'0 0 0 #40d8cf00'}],{duration:1100});}
        panel.querySelector('[data-news-status]').textContent=example?'가격 변동 없는 예시 카드입니다.':`새 뉴스 · ${stock.name} · ${time}`;
        const latest=panel.latestBar;
        latest.headline.textContent=`${breaking?'⚡ 속보':'CIPHER NEWS'} · ${example?'예시':time} · ${stock.name} · ${title}`;
        latest.content.textContent=detail;latest.jump.hidden=false;latest.jump.textContent=`${stock.name} · 차트 보기 →`;latest.jump.onclick=link.onclick;
        latest.bar.style.borderColor=breaking?'#e5bb59':'#40d8cf';latest.headline.style.color=breaking?'#ffd875':'#bcefe9';
        if(!example&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)latest.bar.animate([{boxShadow:`0 0 20px ${breaking?'#e5bb5980':'#40d8cf80'}`},{boxShadow:'0 4px 16px #0005'}],{duration:1000});
    }
    startTutorial(){
        const engine=new MarketEngine();engine.stopEngine();engine.cash=engine.initialCash=100000;
        this.match?.dialog.remove();const match=new CipherTrainingRoom(this.container,engine);this.match=match;
        const tutorialNews=this.createNewsPanel(match);
        this.addNewsCard(match,tutorialNews,{stock:[...engine.stocks.values()][0],title:'대형 공급 계약 체결… 매출 성장 기대',detail:'신규 고객 확보 소식에 매수세가 유입되고 있습니다. 관련 종목 버튼을 눌러 차트를 확인해 보세요.',example:true});
        match.dialog.querySelector('h2').textContent='에이전트 K · 첫 모의투자';
        const guide=document.createElement('section');
        guide.style.cssText='display:flex;gap:18px;align-items:center;padding:18px;border:1px solid #e5bb59;border-radius:14px;background:#102333;cursor:pointer';
        const portrait=document.createElement('img');portrait.src=new URL('../../assets/characters/agent-k/agent-k-dialogue-smile-v1.png?portrait=hd2',import.meta.url).href;portrait.alt='에이전트 K';portrait.decoding='sync';portrait.style.cssText='width:112px;height:136px;flex-shrink:0;object-fit:cover;border:1px solid #e5bb59;border-radius:10px';
        portrait.style.setProperty('image-rendering','auto','important');
        const portraitCanvas=document.createElement('canvas');portraitCanvas.setAttribute('role','img');portraitCanvas.setAttribute('aria-label','에이전트 K');portraitCanvas.style.cssText=portrait.style.cssText;
        portraitCanvas.style.setProperty('image-rendering','auto','important');
        portrait.onload=()=>{
            const density=Math.max(2,window.devicePixelRatio||1);portraitCanvas.width=Math.round(112*density);portraitCanvas.height=Math.round(136*density);
            // Downsample the full-resolution portrait in stages, preserving antialiasing.
            let source=portrait;const cropWidth=portrait.naturalHeight*112/136;
            const crop=document.createElement('canvas');crop.width=Math.round(cropWidth);crop.height=portrait.naturalHeight;
            const cropContext=crop.getContext('2d');cropContext.drawImage(portrait,(portrait.naturalWidth-cropWidth)/2,0,cropWidth,portrait.naturalHeight,0,0,crop.width,crop.height);source=crop;
            while(source.width>portraitCanvas.width*2){const reduced=document.createElement('canvas');reduced.width=Math.round(source.width/2);reduced.height=Math.round(source.height/2);const context=reduced.getContext('2d');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(source,0,0,reduced.width,reduced.height);source=reduced;}
            const context=portraitCanvas.getContext('2d');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(source,0,0,portraitCanvas.width,portraitCanvas.height);
            portrait.replaceWith(portraitCanvas);
        };
        const body=document.createElement('div');body.style.cssText='flex:1;min-width:0';
        const name=document.createElement('strong');name.textContent='에이전트 K';name.style.color='#f5d583';
        const line=document.createElement('p');line.setAttribute('role','status');line.style.lineHeight='1.7';
        const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap';
        const controls=document.createElement('div');controls.style.cssText='display:flex;gap:8px;margin-left:auto';
        const skip=document.createElement('button');skip.textContent='⏩ 스킵';skip.style.cssText='white-space:nowrap;color:#bdc9d5';
        const next=document.createElement('button');next.textContent='다음 ▶';next.style.cssText='white-space:nowrap;background:#493409;color:#ffd35f;border-color:#c69a27;font-weight:700';
        controls.append(skip,next);top.append(name,controls);body.append(top,line);guide.append(portrait,body);match.dialog.querySelector('header').after(guide);
        const steps=[
            ['어서 오세요. 첫 모의투자는 제가 함께하겠습니다. 여기서는 별도의 가상 자금을 사용하므로 실제 계좌의 돈은 줄어들지 않습니다.',null],
            ['왼쪽에서 종목을 고르고 가운데에서 가격과 차트를 확인하세요. 먼저 주문 수량 1주로 매수해 보겠습니다.','.training-order'],
            ['좋습니다. 보유한 주식은 가격이 오르거나 내리면 평가금액도 달라집니다. 이번에는 방금 산 주식을 매도해 보세요.','.training-order'],
            ['내 계좌에서는 남은 현금과 보유 주식, 총자산을 확인할 수 있습니다. 대결은 같은 시작 자금으로 진행하고, 시간이 끝났을 때 총자산이 높은 쪽이 승리합니다.','.training-account'],
            ['차트 위의 최신 뉴스 바를 확인하세요. 제목을 누르면 내용을 펼칠 수 있고, 관련 종목의 차트로 이동할 수 있습니다. 계약 체결이나 실적 악화가 종목과 업종 가격에 영향을 줍니다. 지난 뉴스는 오른쪽 패널에 남습니다.','.arena-latest-news'],
            ['이제 저와 3분 동안 대결해 볼까요? 참가비와 배팅은 0G입니다. 대결 자금 100,000G는 전용 가상 자금이며, 결과가 실제 계좌에 반영되지 않습니다.',null]
        ];
        let step=0,highlight=null;
        const paint=()=>{
            if(highlight){highlight.style.outline='';highlight.style.boxShadow='';}line.textContent=steps[step][0];
            next.hidden=false;next.disabled=step===1||step===2;next.textContent=step===5?'K와 무료 대결 시작':'다음 ▶';
            next.style.opacity=next.disabled?'0.45':'1';next.style.cursor=next.disabled?'default':'pointer';
            next.title=next.disabled?(step===1?'매수를 완료하면 다음 안내로 넘어갑니다.':'매도를 완료하면 다음 안내로 넘어갑니다.'):'';
            match.dialog.querySelector('[data-buy]').disabled=step!==1;match.dialog.querySelector('[data-sell]').disabled=step!==2;
            if(step===3){match.accountVisible=true;match.renderAccount();}
            highlight=steps[step][1]?match.dialog.querySelector(steps[step][1]):null;
            if(highlight){highlight.style.outline='2px solid #40d8cf';highlight.style.boxShadow='0 0 18px #40d8cf35';}
            if(step===4)tutorialNews.latestBar.bar.scrollIntoView({behavior:'smooth',block:'center'});
        };
        const startFreeMatch=()=>{localStorage.setItem('stockwars.arena.k-tutorial.v1','1');match.onClose=null;match.close();this.start({name:'에이전트 K와 무료 대결',minutes:3,cash:100000,stake:0,opponent:'에이전트 K'});};
        const advance=()=>{if(step===1||step===2)return;if(step===5){startFreeMatch();return;}step++;paint();};
        skip.onclick=startFreeMatch;next.onclick=advance;guide.onclick=e=>{if(!e.target.closest('button'))advance();};
        match.order=side=>{if((step===1&&side==='buy')||(step===2&&side==='sell')){CipherTrainingRoom.prototype.order.call(match,side);if((step===1&&engine.portfolio.size>0)||(step===2&&engine.portfolio.size===0)){step++;paint();}}};
        match.onClose=()=>{engine.stopEngine();this.render();};paint();match.open();
    }
    render(){
        this.dialog.innerHTML='<header><div><small>CIPHER ARENA</small><h2>모의투자 대결</h2></div><button data-exit>로비로 돌아가기 · Esc</button></header><p>같은 시작 자금, 같은 시장. 제한 시간 종료 시 총자산으로 순위를 결정합니다.</p><div class="training-workspace" style="grid-template-columns:1fr 1fr"><main><h3>게임 로비 · 내 방</h3><div data-rooms></div><h3>방 만들기</h3><form data-create><label>방 이름<input name="name" maxlength="40" required placeholder="함께 투자해요"></label><label>대결 시간<select name="minutes"><option value="3">3분</option><option value="5" selected>5분</option><option value="10">10분</option></select></label><label>시작 자금<select name="cash"><option value="10000">10,000G</option><option value="100000" selected>100,000G</option><option value="1000000">1,000,000G</option></select></label><label>배팅 금액 (G)<input name="stake" type="number" min="0" max="1000000" step="100" value="0" required><small>0G는 무료 대결 · 로컬 대결용 가상 배팅</small></label><label>방 공개 설정<select name="access"><option value="open">공개방</option><option value="locked">비밀번호방</option></select></label><label data-password-label style="display:none">방 비밀번호<input name="password" type="password" minlength="4" maxlength="32" autocomplete="new-password" placeholder="4~32자"></label><button>방 만들기</button></form></main><aside><h3>친구</h3><form data-friend><input name="name" maxlength="40" required placeholder="친구 닉네임" aria-label="친구 닉네임"><button>친구 추가</button></form><p role="status" data-status></p><div data-friends></div><p style="color:#90a8bd">현재는 로컬 대결 버전입니다. 친구 등록은 기존 친구 목록과 공유하며, 온라인 초대 전송과 다른 사용자 접속은 아직 연결되지 않았습니다.</p></aside></div>';
        this.dialog.querySelector('[data-exit]').onclick=()=>this.close();
        const tutorial=document.createElement('button');tutorial.textContent='K 튜토리얼 · 무료';tutorial.onclick=()=>this.startTutorial();this.dialog.querySelector('header').append(tutorial);
        const publicPanel=document.createElement('section');publicPanel.innerHTML='<h3>공개 게임방</h3><p data-public-status>공개방 서버에 연결 중입니다.</p><div data-public-rooms></div>';
        this.dialog.querySelector('[data-rooms]').before(publicPanel);this.paintPublicRooms();
        const finder=document.createElement('section');finder.innerHTML='<h3>방 찾기</h3><form data-find><input name="query" required maxlength="100" aria-label="방 검색" placeholder="방 이름 · 방장 이름 · 방 코드"><button>검색</button></form><p data-find-status role="status"></p><div data-find-results></div>';
        publicPanel.before(finder);
        finder.querySelector('form').style.cssText='display:flex;align-items:center;gap:10px';
        finder.querySelector('input').style.cssText='flex:1;min-width:0;width:auto';
        finder.querySelector('button').style.cssText='flex:none;white-space:nowrap';
        const sidebar=document.createElement('aside');sidebar.className='arena-public-sidebar';
        sidebar.append(finder,publicPanel);
        this.dialog.querySelector('.training-workspace').prepend(sidebar);
        finder.querySelector('form').onsubmit=async e=>{
            e.preventDefault();const query=String(new FormData(e.target).get('query')).trim();if(!query)return;
            const results=finder.querySelector('[data-find-results]'),status=finder.querySelector('[data-find-status]');results.replaceChildren();status.textContent='검색 중…';
            const local=this.rooms.filter(r=>`${r.id} ${r.name}`.toLowerCase().includes(query.toLowerCase()));let remote=[],error='';
            try{remote=(await this.arenaRequest({action:'find',query})).rooms;}catch(err){error=err.message;}
            const seen=new Set();for(const room of [...local,...remote]){
                if(seen.has(room.id))continue;seen.add(room.id);
                const row=document.createElement('p');row.textContent=`${room.name} · ${room.host||'내 방'} · ${room.minutes}분 `;
                const join=document.createElement('button');join.textContent='참가하기';join.onclick=async()=>{
                    if(local.some(r=>r.id===room.id)){this.requestJoin(room);return;}
                    if(room.locked){const password=document.createElement('input');password.type='password';password.placeholder='방 비밀번호';row.append(password);join.textContent='비밀번호 확인';join.onclick=()=>enterRemote(room,password.value);password.focus();}else await enterRemote(room);
                };
                const enterRemote=async(room,password='')=>{try{await this.arenaRequest({action:'join',id:room.id,passwordHash:password?await arenaPasswordHash(password):undefined});status.textContent='참가 요청 확인 · 온라인 대결 시작 연결 준비 중';}catch(err){status.textContent=err.message;}};
                row.append(join);results.append(row);
            }
            status.textContent=error?`${local.length}개 내 방 검색 · ${error}`:`${seen.size}개 방을 찾았습니다.`;
        };
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
            const room={passwordHash,stake,id:crypto.randomUUID(),name,minutes:Number(data.get('minutes')),cash:Number(data.get('cash')),invited:[]};this.rooms.push(room);this.save();this.join(room);
        };
        this.dialog.querySelector('[data-friend]').onsubmit=e=>{e.preventDefault();const result=this.friends.addFriendByName(new FormData(e.target).get('name'));this.render();this.dialog.querySelector('[data-status]').textContent=result.message;};
        for(const room of this.rooms){
            const card=document.createElement('section');card.style.cssText='padding:16px;margin:12px 0;border:1px solid #344e68;border-radius:12px';
            const title=document.createElement('h3');title.textContent=room.name;const info=document.createElement('p');info.textContent=`${room.passwordHash?'🔒 비밀번호방':'공개방'} · ${room.minutes}분 · ${room.cash.toLocaleString()}G · 배팅 ${(room.stake||0).toLocaleString()}G · 참가자 나 + AI`;
            const code=document.createElement('p');code.textContent=`방 코드: ${room.id}`;code.style.cssText='font-size:12px;overflow-wrap:anywhere;user-select:all';
            const start=document.createElement('button');start.textContent='방 참가하기';start.onclick=()=>this.requestJoin(room);
            const remove=document.createElement('button');remove.textContent='방 삭제';remove.style.marginLeft='8px';remove.onclick=()=>{this.rooms=this.rooms.filter(r=>r.id!==room.id);this.save();this.render();};card.append(title,info,code,start,remove);this.dialog.querySelector('[data-rooms]').append(card);
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
    async arenaRequest(input){
        if(!this.arenaToken){
            const response=await fetch('/api/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'session'})});
            if(!response.ok)throw new Error('공개방 서버가 연결되지 않았습니다.');this.arenaToken=(await response.json()).token;
        }
        const response=await fetch('/api/arena',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${this.arenaToken}`},body:JSON.stringify(input)});
        if(!response.ok){if(response.status===401)this.arenaToken=null;throw new Error('공개방을 불러올 수 없습니다.');}return response.json();
    }
    async refreshPublicRooms(){
        if(this.publicLoading)return;this.publicLoading=true;
        try{
            for(const room of this.rooms)await this.arenaRequest({action:'publish',room:{...room,stake:room.stake||0}});
            this.publicRooms=(await this.arenaRequest({action:'list'})).rooms;this.publicError=null;
        }catch(error){this.publicError=error.message;}finally{this.publicLoading=false;if(this.dialog.open)this.paintPublicRooms();}
    }
    paintPublicRooms(){
        const list=this.dialog.querySelector('[data-public-rooms]');if(!list)return;list.replaceChildren();
        this.dialog.querySelector('[data-public-status]').textContent=this.publicError||((this.publicRooms||[]).length?'다른 사용자가 만든 공개방입니다.':'현재 다른 사용자가 만든 공개방이 없습니다.');
        for(const room of this.publicRooms||[]){
            const card=document.createElement('section');card.style.cssText='padding:16px;border:1px solid #456075;border-radius:12px;margin:12px 0';
            const info=document.createElement('p');info.textContent=`${room.name} · ${room.host} · ${room.minutes}분 · 배팅 ${room.stake.toLocaleString()}G`;
            const join=document.createElement('button');join.textContent='방 참가하기';join.onclick=async()=>{
                join.disabled=true;try{await this.arenaRequest({action:'join',id:room.id});info.textContent+=' · 참가 요청 확인 · 온라인 대결 시작 연결 준비 중';}catch(error){this.dialog.querySelector('[data-public-status]').textContent=error.message;}finally{join.disabled=false;}
            };card.append(info,join);list.append(card);
        }
    }
    join(room){
        this.render();
        const main=this.dialog.querySelector('.training-workspace>main');main.replaceChildren();
        const waiting=document.createElement('section');waiting.style.cssText='padding:24px;border:1px solid #d5b461;border-radius:14px;background:#152d40;margin-bottom:20px';
        const title=document.createElement('h3');title.textContent=`${room.name} · 대결 대기실`;
        const details=document.createElement('p');details.textContent=`대결 ${room.minutes}분 · 시작 자금 ${room.cash.toLocaleString()}G · 배팅 ${(room.stake||0).toLocaleString()}G`;
        const code=document.createElement('p');code.textContent=`방 코드: ${room.id}`;code.style.cssText='font-size:12px;overflow-wrap:anywhere;user-select:all;color:#a8bfd0';
        const players=document.createElement('h3');players.textContent='참가 인원 · 2명 (나 + AI)';
        const roster=document.createElement('div');roster.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:20px 0';
        for(const [name,role] of [['나','방장 · 준비 완료'],['AI 상대','컴퓨터 참가자 · 준비 완료']]){const card=document.createElement('div');card.style.cssText='padding:24px 16px;background:#0e2031;border:1px solid #3c647b;border-radius:12px;text-align:center';const avatar=document.createElement('div');avatar.textContent=name==='나'?'👤':'🤖';avatar.style.cssText='font-size:30px;margin-bottom:12px';const label=document.createElement('strong');label.textContent=name;const ready=document.createElement('p');ready.textContent=role;ready.style.cssText='font-size:13px;color:#71dccc';card.append(avatar,label,ready);roster.append(card);}
        const connection=document.createElement('p');connection.textContent='현재는 나와 AI의 로컬 대결입니다. 다른 사용자의 실시간 참가와 준비 상태는 아직 연결되지 않았습니다.';connection.style.cssText='color:#90a8bd;font-size:13px;line-height:1.7';
        const start=document.createElement('button');start.textContent='대결 시작';start.onclick=()=>this.start(room);
        const leave=document.createElement('button');leave.textContent='방 나가기';leave.style.marginLeft='10px';leave.onclick=()=>this.render();
        waiting.append(title,details,code,players,roster,connection,start,leave);
        main.append(waiting);
        start.focus();
    }
    showResults(match,room,players){
        const popup=document.createElement('dialog');popup.setAttribute('aria-label','모의투자 대결 최종 순위');
        popup.style.cssText='position:fixed;inset:auto;left:50%;top:50%;transform:translate(-50%,-50%);margin:0;box-sizing:border-box;width:min(620px,calc(100vw - 32px));max-height:85dvh;overflow:auto;padding:30px;border:1px solid #d6b45a;border-radius:20px;background:linear-gradient(140deg,#193448,#081522);color:#edf4fa;box-shadow:0 24px 90px #0009';
        const style=document.createElement('style');style.textContent='dialog[aria-label="모의투자 대결 최종 순위"]::backdrop{background:#030b16bd;backdrop-filter:blur(5px)}';popup.append(style);
        const badge=document.createElement('small');badge.textContent='MATCH RESULT';badge.style.cssText='color:#e5c267;letter-spacing:2px';
        const title=document.createElement('h2');title.textContent='대결 종료 · 최종 순위';
        const subtitle=document.createElement('p');subtitle.textContent=`${room.name} · ${room.minutes}분 · 시작 자금 ${room.cash.toLocaleString()}G`;subtitle.style.color='#a8bfd0';
        const sorted=[...players].sort((a,b)=>b.assets-a.assets);
        title.textContent=`승자: ${sorted.filter(p=>p.assets===sorted[0].assets).map(p=>p.name).join(', ')}`;
        const winners=sorted.filter(p=>p.assets===sorted[0].assets),pot=(room.stake||0)*sorted.length;
        const history=JSON.parse(localStorage.getItem('stockwars.arena.aiHistory')||'[]');
        history.push({id:room.id,name:room.name,ended:Date.now(),cash:room.cash,stake:room.stake||0,ai:true,results:sorted.map((p,i)=>({...p,isOwn:p.name==='나',rank:p.assets===sorted[0].assets?1:i+1,payout:winners.includes(p)?Math.floor(pot/winners.length):0}))});
        localStorage.setItem('stockwars.arena.aiHistory',JSON.stringify(history.slice(-100)));
        const table=document.createElement('table');table.style.cssText='width:100%;border-collapse:collapse;margin:24px 0;text-align:left';
        const header=document.createElement('tr');for(const label of ['순위','참가자','총자산','수익률']){const cell=document.createElement('th');cell.textContent=label;cell.style.cssText='padding:12px 6px;color:#9bb6c9;border-bottom:1px solid #345368;font-size:13px';header.append(cell);}const head=document.createElement('thead');head.append(header);table.append(head);
        const body=document.createElement('tbody');let rank=1;
        sorted.forEach((player,index)=>{
            if(index&&player.assets!==sorted[index-1].assets)rank=index+1;
            const row=document.createElement('tr');if(player.name==='나')row.style.background='#214356';
            const rate=(player.assets/room.cash-1)*100;
            for(const [column,value] of [`${rank===1?'🏆 ':''}${rank}위`,player.name,`${Math.round(player.assets).toLocaleString()}G`,`${rate>=0?'+':''}${rate.toFixed(2)}%`].entries()){
                const cell=document.createElement('td');cell.textContent=value;cell.style.cssText='padding:18px 6px;border-bottom:1px solid #294457;font-weight:700';if(column===0)cell.style.color='#f5d583';if(column===3)cell.style.color=rate>=0?'#ff9199':'#7cbdff';row.append(cell);
            }body.append(row);
        });table.append(body);
        const note=document.createElement('p');note.textContent=`가상 배당 ${winners.some(p=>p.name==='나')?Math.floor(pot/winners.length).toLocaleString():0}G · 실제 지급 0G · 모의투자 전용 가상 계좌입니다.`;note.style.cssText='font-size:13px;color:#9cb5c8;line-height:1.6';
        const actions=document.createElement('div');actions.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin-top:24px';
        const review=document.createElement('button');review.textContent='거래 화면 확인';review.onclick=()=>{popup.close();popup.remove();};
        const back=document.createElement('button');back.textContent='대결 로비로 돌아가기';back.style.cssText='background:#dfb957;color:#102234;font-weight:700';back.onclick=()=>{popup.close();popup.remove();match.close();};actions.append(review,back);
        popup.append(badge,title,subtitle,table,note,actions);match.dialog.append(popup);popup.addEventListener('cancel',event=>{event.preventDefault();review.click();});popup.showModal();back.focus();
    }
    start(room){
        if(!validArenaStake(room.cash,room.stake||0)){this.dialog.querySelector('[data-status]').textContent='이 방의 배팅 금액이 새 범위를 벗어납니다. 방을 다시 만들어 주세요.';return;}
        const engine=new MarketEngine();engine.cash=engine.initialCash=room.cash;
        const bot={cash:room.cash,positions:new Map()};
        const opponent=room.opponent||'AI';
        this.match?.dialog.remove();const match=new CipherTrainingRoom(this.container,engine);this.match=match;
        match.dialog.querySelector('h2').textContent=room.name;
        match.dialog.querySelector('[data-close]').textContent='대결 포기';
        const status=document.createElement('p');status.style.color='#f5d583';match.dialog.querySelector('header').after(status);
        status.style.cssText='position:sticky;top:0;z-index:8;margin:0;padding:14px 18px;border:1px solid #45677a;border-radius:12px;background:#142c3ef5;color:#f5d583;box-shadow:0 5px 18px #0005;display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center';
        const rankLabel=document.createElement('strong'),assetLabel=document.createElement('span'),gapLabel=document.createElement('span'),clockLabel=document.createElement('strong'),rankNotice=document.createElement('span');
        rankNotice.setAttribute('role','status');rankNotice.setAttribute('aria-live','polite');rankNotice.style.cssText='color:#70e1d7;font-size:13px';clockLabel.style.marginLeft='auto';status.append(rankLabel,assetLabel,gapLabel,clockLabel,rankNotice);
        let previousRank=null,noticeUntil=0;
        const news=this.createNewsPanel(match);
        const rankResize=new ResizeObserver(()=>{news.latestBar.bar.style.top=`${status.getBoundingClientRect().height+8}px`;});rankResize.observe(status);
        const newsEvents=[
            {title:'대형 공급 계약 체결… 매출 성장 기대',detail:'신규 고객 확보 소식에 매수세가 유입되고 있습니다.',impact:.035},
            {title:'분기 실적 예상 하회… 투자 심리 위축',detail:'비용 증가와 수익성 둔화 우려가 제기됐습니다.',impact:-.035},
            {title:'신제품 공개… 시장 점유율 확대 기대',detail:'새로운 제품군에 대한 긍정적인 반응이 이어지고 있습니다.',impact:.025},
            {title:'공급망 지연 발생… 출하 일정 조정',detail:'일시적인 공급 차질로 단기 불확실성이 커졌습니다.',impact:-.025},
            {title:'업종 지원 정책 발표… 동반 상승 기대',detail:'같은 업종 기업들에 정책 수혜 기대가 확산되고 있습니다.',impact:.018,sector:true},
            {title:'업종 규제 검토… 관련 기업 관망세',detail:'같은 업종에 규제 비용 부담 우려가 번지고 있습니다.',impact:-.018,sector:true}
        ];
        let nextNewsAt=Date.now()+3000,lastNewsStock=null;
        const publishNews=()=>{
            const stocks=[...engine.stocks.values()].filter(stock=>stock.id!==lastNewsStock),stock=stocks[Math.floor(Math.random()*stocks.length)];lastNewsStock=stock.id;
            const event=newsEvents[Math.floor(Math.random()*newsEvents.length)];
            const breaking=Math.random()<.25;
            const targets=event.sector?stocks.filter(item=>item.sector===stock.sector):[stock];
            for(const target of targets){
                target.prevPrice=target.price;target.price=Math.max(10,Math.round(target.price*(1+event.impact*(breaking?1.35:1))));
                const history=engine.priceHistory.get(target.id);if(history){history.push(target.price);if(history.length>50)history.shift();}
            }
            const elapsed=room.minutes*60-Math.ceil((deadline-Date.now())/1000);
            this.addNewsCard(match,news,{stock,title:event.title,detail:event.detail,time:`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`,sector:event.sector,breaking});
            engine.notify();nextNewsAt=Date.now()+5000+Math.floor(Math.random()*3001);
        };
        const deadline=Date.now()+room.minutes*60000;let finished=false;
        const botAssets=()=>bot.cash+[...bot.positions].reduce((sum,[id,qty])=>sum+(engine.stocks.get(id)?.price||0)*qty,0);
        const updateStandings=remaining=>{
            const mine=engine.getState().totalNetWorth,other=botAssets(),rank=mine===other?'공동 1위':mine>other?'1위':'2위';
            rankLabel.textContent=`${rank==='2위'?'':'🏆 '}내 순위 · ${rank}`;assetLabel.textContent=`내 총자산 ${Math.round(mine).toLocaleString()}G`;
            gapLabel.textContent=mine===other?`${opponent}와 동점`:mine>other?`${opponent}보다 ${Math.round(mine-other).toLocaleString()}G 앞서는 중`:`선두 ${opponent}와 ${Math.round(other-mine).toLocaleString()}G 차이`;
            clockLabel.textContent=`남은 시간 ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;clockLabel.style.color=remaining<=30?'#ff8c98':'#f5d583';status.style.borderColor=remaining<=30?'#cf6472':'#45677a';
            if(previousRank!==null&&previousRank!==rank){rankNotice.textContent=rank==='2위'?`${opponent}가 앞서고 있습니다!`:rank==='1위'?'1위로 올라섰습니다!':'공동 1위 · 접전입니다!';noticeUntil=Date.now()+3000;if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)status.animate([{boxShadow:'0 0 22px #f5d58370'},{boxShadow:'0 5px 18px #0005'}],{duration:900});}
            if(Date.now()>noticeUntil)rankNotice.textContent='';previousRank=rank;
        };
        const finish=(quit=false)=>{
            if(finished)return;finished=true;clearInterval(timer);rankResize.disconnect();engine.stopEngine();
            this.rooms=this.rooms.filter(r=>r.id!==room.id);this.save();
            news.querySelector('[data-news-status]').textContent='대결 종료 · 뉴스 기록을 확인할 수 있습니다.';
            match.dialog.querySelector('[data-buy]').disabled=true;match.dialog.querySelector('[data-sell]').disabled=true;
            const mine=engine.getState().totalNetWorth,other=botAssets();
            status.textContent=quit?'대결을 포기했습니다.':`대결 종료 · ${mine>other?'1위 나':mine<other?`1위 ${opponent}`:'공동 1위'} · 내 총자산 ${Math.round(mine).toLocaleString()}G · ${opponent} ${Math.round(other).toLocaleString()}G${room.opponent?' · 참가비 0G · 실제 계좌 변동 없음':''}`;
            match.dialog.querySelector('[data-close]').textContent='대결 로비로 돌아가기';
            if(!quit)this.showResults(match,room,[{name:'나',assets:mine},{name:opponent,assets:other}]);
        };
        match.onClose=()=>{finish(true);this.render();};
        match.order=side=>{if(!finished)CipherTrainingRoom.prototype.order.call(match,side);};
        const timer=setInterval(()=>{
            const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(!remaining){finish();return;}
            if(Date.now()>=nextNewsAt)publishNews();
            updateStandings(remaining);
            if(remaining%5===0){const stocks=[...engine.stocks.values()],stock=stocks[Math.floor(Math.random()*stocks.length)];if(Math.random()<.6){const qty=Math.floor(bot.cash*.15/stock.price);if(qty>0){bot.cash-=qty*stock.price;bot.positions.set(stock.id,(bot.positions.get(stock.id)||0)+qty);}}else{const holding=[...bot.positions][0];if(holding){bot.cash+=engine.stocks.get(holding[0]).price*holding[1];bot.positions.delete(holding[0]);}}}
        },1000);
        updateStandings(room.minutes*60);engine.startEngine();match.open();
    }
}



installOnlineCompetition(CipherCompetitionRoom);
