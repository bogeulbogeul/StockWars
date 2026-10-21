import {tradeHardArenaBot} from './arenaBot.js';
import {MarketEngine} from '../engine/marketEngine.js';
import {FriendManager} from '../engine/FriendManager.js';
import {CipherTrainingRoom} from './CipherTrainingRoom.js';
import {installOnlineCompetition} from './OnlineCompetition.js';
import {saveAiArenaHistory} from './arenaHistory.js';
import {AGENT_K_PORTRAIT_URL} from './CipherAgentK.js';

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
            .cipher-arena{background:#0b1420;padding:32px clamp(20px,4vw,72px);overflow:auto}
            .cipher-arena[open]{gap:24px}
            .cipher-arena>header,.cipher-arena>.training-workspace,.cipher-arena>.arena-intro{width:100%;max-width:1440px;box-sizing:border-box;margin:0 auto}
            .cipher-arena>header{gap:10px;justify-content:flex-end;padding:0 0 24px;border-bottom:1px solid #263443;flex-wrap:wrap}
            .cipher-arena>header>div{margin-right:auto}.cipher-arena>header h2{font-size:28px;letter-spacing:-1px;margin:8px 0 0}
            .cipher-arena>header small{font-size:10px;letter-spacing:2.5px;color:#cbb273}
            .cipher-arena>header [data-exit]{order:1;margin-left:6px}
            .cipher-arena>.arena-intro{display:flex;align-items:center;gap:14px;color:#93a5b7;font-size:14px;line-height:1.7;padding:0 2px}
            .cipher-arena .arena-intro strong{color:#d8c18c;font-size:12px;white-space:nowrap;border:1px solid #524b39;padding:3px 10px;border-radius:6px;font-weight:500}
            .cipher-arena .training-workspace{display:grid;grid-template-columns:minmax(250px,1fr) minmax(370px,1.45fr) minmax(240px,.8fr);gap:20px;align-items:start;flex:none;min-height:0}
            .cipher-arena .training-workspace>main,.cipher-arena .training-workspace>aside{box-sizing:border-box;min-width:0;overflow:visible;background:#111e2d;border:1px solid #283747;padding:24px;border-radius:14px}
            .cipher-arena h3{color:#ecf0f5;font-size:16px;letter-spacing:-.3px;margin:0 0 20px}
            .cipher-arena .arena-section-note{font-size:13px;line-height:1.7;color:#8fa3b6;margin:-10px 0 24px}
            .cipher-arena small{font-size:11px;letter-spacing:0;color:#8fa3b6;line-height:1.6}
            .cipher-arena button,.cipher-arena input,.cipher-arena select{box-sizing:border-box;font:inherit;font-size:13px;border:1px solid #33465a;border-radius:8px;background:#152537;color:#e7edf4;min-height:42px;padding:10px 12px;margin:0}
            .cipher-arena button{cursor:pointer}.cipher-arena button:hover:not(:disabled){background:#22364b;border-color:#62758b}.cipher-arena button:disabled{opacity:.45;cursor:default}
            .cipher-arena :is(button,input,select):focus-visible{outline:2px solid #e3c67f;outline-offset:3px}
            .cipher-arena input::placeholder{color:#7e91a5}.cipher-arena input,.cipher-arena select{width:100%;min-width:0}
            .cipher-arena form[data-create]{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px 16px}
            .cipher-arena form label{display:flex;flex-direction:column;gap:9px;font-size:12px;color:#a5b5c6;min-width:0}
            .cipher-arena form[data-create] label:has([name=mode]),.cipher-arena form[data-create] label:has([name=name]){grid-column:1/-1}
            .cipher-arena form[data-create]>button{grid-column:1/-1;margin-top:4px;min-height:46px;background:#d9b969;border-color:#d9b969;color:#18202b;font-weight:700}
            .cipher-arena form[data-create]>button:hover:not(:disabled){background:#e9cc86;border-color:#e9cc86}
            .cipher-arena [data-friend]{display:flex;gap:8px}.cipher-arena [data-friend] input{flex:1;min-width:0}.cipher-arena [data-friend] button{white-space:nowrap}
            .cipher-arena [data-friends]{margin-top:22px}.cipher-arena [data-friends] p{font-size:13px;line-height:1.8;color:#8fa3b6;margin:0;padding:18px 0;border-top:1px solid #293949}
            .cipher-arena [data-status]{color:#d8c18c;font-size:13px;line-height:1.7;overflow-wrap:anywhere}.cipher-arena [data-status]:empty,.cipher-arena [data-find-status]:empty{display:none}
            .cipher-arena .arena-public-sidebar>section+section{border-top:1px solid #293949;padding-top:24px;margin-top:24px}
            .cipher-arena [data-public-status],.cipher-arena [data-find-status],.cipher-arena [data-rooms]{font-size:13px;color:#8fa3b6;line-height:1.8;overflow-wrap:anywhere}
            .cipher-arena [data-public-rooms],.cipher-arena [data-find-results],.cipher-arena [data-rooms]{max-height:360px;overflow:auto;overscroll-behavior:contain}
            .cipher-arena [data-public-rooms]>section,.cipher-arena [data-find-results]>section,.cipher-arena [data-rooms]>section{background:#152537;border-color:#33465a!important}
            .cipher-arena [data-rooms] h3{font-size:14px;margin-bottom:10px}
            @media(max-width:1100px){.cipher-arena .training-workspace{grid-template-columns:minmax(240px,1fr) minmax(340px,1.4fr)}.cipher-arena .training-workspace>aside:last-child{grid-column:1/-1}}
            @media(max-width:700px){.cipher-arena{padding:20px 16px}.cipher-arena>header>div{width:100%;margin-bottom:8px}.cipher-arena>header{justify-content:flex-start}.cipher-arena>header h2{font-size:25px}.cipher-arena .training-workspace{grid-template-columns:minmax(0,1fr)}.cipher-arena .training-workspace>main{grid-row:1}.cipher-arena .training-workspace>main,.cipher-arena .training-workspace>aside{padding:20px}.cipher-arena>.arena-intro{align-items:flex-start;font-size:12px}}
            @media(max-width:380px){.cipher-arena form[data-create]{grid-template-columns:minmax(0,1fr)}}`;
            document.head.append(style);
        }
    }
    open({skipTutorial=false}={}){this.dialog.showModal();this.render();this.refreshPublicRooms();this.publicTimer=setInterval(()=>this.refreshPublicRooms(),15000);if(!skipTutorial&&!localStorage.getItem('stockwars.arena.k-tutorial.v1'))this.startTutorial();}
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
        match.dialog.querySelector('h2').textContent='토리 · 첫 모의투자';
        const guide=document.createElement('section');
        guide.style.cssText='display:flex;gap:18px;align-items:center;padding:18px;border:1px solid #e5bb59;border-radius:14px;background:#102333;cursor:pointer';
        const portrait=document.createElement('img');portrait.src=AGENT_K_PORTRAIT_URL;portrait.alt='토리';portrait.decoding='sync';portrait.style.cssText='width:112px;height:136px;flex-shrink:0;object-fit:contain;border:1px solid #e5bb59;border-radius:10px';
        portrait.style.setProperty('image-rendering','auto','important');
        const portraitCanvas=document.createElement('canvas');portraitCanvas.setAttribute('role','img');portraitCanvas.setAttribute('aria-label','토리');portraitCanvas.style.cssText=portrait.style.cssText;
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
        const name=document.createElement('strong');name.textContent='토리';name.style.color='#f5d583';
        const line=document.createElement('p');line.setAttribute('role','status');line.style.lineHeight='1.7';
        const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap';
        const controls=document.createElement('div');controls.style.cssText='display:flex;gap:8px;margin-left:auto';
        const skip=document.createElement('button');skip.textContent='⏩ 스킵';skip.style.cssText='white-space:nowrap;color:#bdc9d5';
        const next=document.createElement('button');next.textContent='다음 ▶';next.style.cssText='white-space:nowrap;background:#493409;color:#ffd35f;border-color:#c69a27;font-weight:700';
        controls.append(skip,next);top.append(name,controls);body.append(top,line);guide.append(portrait,body);match.dialog.querySelector('header').after(guide);
        const steps=[
            ['어서 오세요. 첫 모의투자는 제가 함께하겠습니다. 여기서는 별도의 가상 자금을 사용하므로 실제 계좌의 돈은 줄어들지 않습니다.',null],
            ['왼쪽 종목 목록입니다. 이름이나 코드로 검색하고 업종을 골라 종목을 좁힐 수 있습니다. 종목을 누르면 그 기업의 가격과 차트가 가운데 표시됩니다.','.training-stocks'],
            ['가운데는 선택한 종목의 현재 가격과 차트입니다. 어떤 종목을 보고 있는지 이름부터 확인하세요. 지금은 주문 연습에 집중할 수 있도록 시세와 대결 타이머를 멈춰두었습니다.','.training-chart'],
            ['호가는 사고팔려는 가격과 물량입니다. 주문 수량과 예상 금액을 확인한 다음 매수하거나 매도합니다. 공매도와 레버리지는 해금 상태에 따라 사용할 수 있습니다. 첫 연습은 1배·1주로 진행합니다.','.training-book'],
            ['왼쪽에서 종목을 고르고 가운데에서 가격과 차트를 확인하세요. 먼저 주문 수량 1주로 매수해 보겠습니다.','.training-order'],
            ['좋습니다. 보유한 주식은 가격이 오르거나 내리면 평가금액도 달라집니다. 이번에는 방금 산 주식을 매도해 보세요.','.training-order'],
            ['내 계좌에서는 남은 현금과 보유 주식, 총자산을 확인할 수 있습니다. 대결은 같은 시작 자금으로 진행하고, 시간이 끝났을 때 총자산이 높은 쪽이 승리합니다.','.training-account'],
            ['차트 위의 최신 뉴스 바를 확인하세요. 제목을 누르면 내용을 펼칠 수 있고, 관련 종목의 차트로 이동할 수 있습니다. 계약 체결이나 실적 악화가 종목과 업종 가격에 영향을 줍니다. 지난 뉴스는 오른쪽 패널에 남습니다.','.arena-latest-news'],
            ['이제 저와 3분 동안 대결해 볼까요? 참가비와 배팅은 0G입니다. 대결 자금 10만 G는 전용 가상 자금이며, 결과가 실제 계좌에 반영되지 않습니다.',null]
        ];
        const buyStep=4,sellStep=5,accountStep=6,newsStep=7,lastStep=steps.length-1;
        let step=0,highlight=null,practiceStock=null;
        const paint=()=>{
            if(highlight){highlight.style.outline='';highlight.style.boxShadow='';}line.textContent=steps[step][0];
            next.hidden=false;next.disabled=step===buyStep||step===sellStep;next.textContent=step===lastStep?'토리와 무료 대결 시작':'다음 ▶';
            next.style.opacity=next.disabled?'0.45':'1';next.style.cursor=next.disabled?'default':'pointer';
            next.title=next.disabled?(step===buyStep?'매수를 완료하면 다음 안내로 넘어갑니다.':'매도를 완료하면 다음 안내로 넘어갑니다.'):'';
            match.dialog.querySelector('[data-buy]').disabled=step!==buyStep;match.dialog.querySelector('[data-sell]').disabled=step!==sellStep;
            if(step===accountStep){match.accountVisible=true;match.renderAccount();}
            highlight=steps[step][1]?match.dialog.querySelector(steps[step][1]):null;
            if(highlight){highlight.style.outline='2px solid #40d8cf';highlight.style.boxShadow='0 0 18px #40d8cf35';}
            if(step===newsStep)tutorialNews.latestBar.bar.scrollIntoView({behavior:'smooth',block:'center'});
        };
        const startFreeMatch=()=>{try{localStorage.setItem('stockwars.arena.k-tutorial.v1','1');}catch{}match.onClose=null;match.close();this.start({name:'토리와 무료 대결',minutes:3,cash:100000,stake:0,opponent:'토리',difficulty:'easy'});};
        const advance=()=>{if(step===buyStep||step===sellStep)return;if(step===lastStep){startFreeMatch();return;}step++;paint();};
        skip.textContent='연습 그만하기';skip.onclick=()=>match.close();next.onclick=advance;guide.onclick=e=>{if(!e.target.closest('button'))advance();};
        match.order=side=>{if((step===buyStep&&side==='buy')||(step===sellStep&&side==='sell')){
            if(side==='sell')match.selected=practiceStock;
            match.shortMode=false;match.leverage=1;match.modeSelect.value='long';match.leverageSelect.value='1';match.dialog.querySelector('[type=number]').value='1';
            CipherTrainingRoom.prototype.order.call(match,side);
            if((step===buyStep&&engine.portfolio.size>0)||(step===sellStep&&engine.portfolio.size===0)){if(side==='buy')practiceStock=match.selected;step++;paint();}
        }};
        match.onClose=()=>{engine.stopEngine();this.render();};paint();match.open();
    }
    render(){
        this.dialog.innerHTML='<header><div><small>CIPHER ARENA</small><h2>모의투자 대결</h2></div><button data-exit>로비로 돌아가기 · Esc</button></header><p class="arena-intro"><strong>모의투자</strong><span>같은 자금, 같은 시장에서 시작합니다. 제한 시간 종료 시 총자산으로 순위를 결정합니다.</span></p><div class="training-workspace"><main><div data-rooms hidden></div><h3>새 대결 만들기</h3><p class="arena-section-note">대결 조건을 정하고 함께할 상대를 초대하세요.</p><form data-create><label>방 이름<input name="name" maxlength="40" required placeholder="함께 투자해요"></label><label>대결 시간<select name="minutes"><option value="3">3분</option><option value="5" selected>5분</option><option value="10">10분</option></select></label><label>시작 자금<select name="cash"><option value="10000">1만 G</option><option value="100000" selected>10만 G</option><option value="1000000">100만 G</option></select></label><label>배팅 금액 (G)<input name="stake" type="number" min="0" max="1000000" step="100" value="0" required><small>0G는 무료 대결 · 로컬 대결용 가상 배팅</small></label><label>방 공개 설정<select name="access"><option value="open">공개방</option><option value="locked">비밀번호방</option></select></label><label data-password-label style="display:none">방 비밀번호<input name="password" type="password" minlength="4" maxlength="32" autocomplete="new-password" placeholder="4~32자"></label><button>방 만들기</button></form></main><aside><h3>온라인 친구</h3><form data-friend><input name="name" type="search" maxlength="40" placeholder="친구 닉네임" aria-label="친구 닉네임 검색"><button>검색</button></form><p role="status" data-status></p><div data-friends></div><p style="color:#90a8bd">현재는 로컬 대결 버전입니다. 친구 등록은 기존 친구 목록과 공유하며, 온라인 초대 전송과 다른 사용자 접속은 아직 연결되지 않았습니다.</p></aside></div>';
        this.dialog.querySelector('[data-exit]').onclick=()=>this.close();
        const tutorial=document.createElement('button');tutorial.textContent='토리 튜토리얼 · 무료';tutorial.onclick=()=>this.startTutorial();this.dialog.querySelector('header').append(tutorial);
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
        form.append(title,input,error,enter,cancel);const joinPanel=this.dialog.querySelector('[data-rooms]');joinPanel.hidden=false;joinPanel.prepend(form);
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
        const sorted=[...players].sort((a,b)=>b.assets-a.assets);
        const winners=sorted.filter(p=>p.assets===sorted[0].assets),pot=(room.stake||0)*sorted.length;
        saveAiArenaHistory(room,players);
        const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
        const popup=make('dialog','arena-result');popup.setAttribute('aria-label','모의투자 대결 최종 순위');
        const style=document.createElement('style');style.textContent=`
            dialog.arena-result{position:fixed;inset:0;margin:auto;box-sizing:border-box;width:min(620px,calc(100vw - 32px));max-width:none;max-height:calc(100dvh - 40px);overflow:auto;padding:32px;border:1px solid #334356;border-radius:18px;background:#101c2a;color:#eaf0f6;box-shadow:0 28px 100px #0008;font:inherit}
            .arena-result::backdrop{background:#040b14c9;backdrop-filter:blur(6px)}
            .arena-result .result-eyebrow{display:block;color:#d9bd7c;font-size:10px;letter-spacing:2.5px;margin-bottom:12px}
            .arena-result .result-title{margin:0;font-size:28px;line-height:1.3;letter-spacing:-.8px;overflow-wrap:anywhere}
            .arena-result .result-subtitle{margin:10px 0 24px;color:#93a6b9;font-size:13px;line-height:1.7;overflow-wrap:anywhere}
            .arena-result .result-summary{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;background:#172738;border:1px solid #2b3c4f;border-radius:12px;margin-bottom:26px}
            .arena-result .result-summary>div+div{border-left:1px solid #324254;padding-left:20px}
            .arena-result .result-summary span{display:block;font-size:12px;color:#9bafc2;margin-bottom:8px}
            .arena-result .result-summary strong{font-size:24px;letter-spacing:-.5px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
            .arena-result .result-section-title{font-size:13px;color:#d6e0eb;margin:0 0 8px}
            .arena-result .result-table-wrap{overflow-x:auto}
            .arena-result .result-table{width:100%;border-collapse:collapse;text-align:left;table-layout:fixed;font-size:13px;font-variant-numeric:tabular-nums}
            .arena-result .result-table th{font-size:11px;font-weight:500;color:#91a4b8;padding:12px 10px;border-bottom:1px solid #314255}
            .arena-result .result-table td{padding:16px 10px;border-bottom:1px solid #263648;overflow-wrap:anywhere}
            .arena-result .result-table th:first-child{width:14%}.arena-result .result-table th:nth-child(3){width:30%}.arena-result .result-table th:last-child{width:22%}
            .arena-result .result-table :is(th,td):nth-child(n+3){text-align:right}
            .arena-result .result-own{background:#172637}.arena-result .result-own td:nth-child(2){font-weight:700}
            .arena-result .result-first{color:#dfc384;font-weight:700}
            .arena-result .result-positive{color:#f18d99}.arena-result .result-negative{color:#86bafa}.arena-result .result-neutral{color:#bccbda}
            .arena-result .result-note{font-size:12px;color:#94a7ba;line-height:1.8;margin:20px 0 0}
            .arena-result .result-note strong{color:#c4d1df;font-weight:500}
            .arena-result .result-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px;padding-top:20px;border-top:1px solid #2b3b4c}
            .arena-result .result-actions button{font:inherit;font-size:13px;min-height:42px;padding:10px 16px;border-radius:8px;border:1px solid #3b4d61;background:#17283a;color:#dde6ef;cursor:pointer}
            .arena-result .result-actions .result-primary{background:#d9b969;border-color:#d9b969;color:#18202b;font-weight:700}
            .arena-result .result-actions button:hover{filter:brightness(1.1)}.arena-result .result-actions button:focus-visible{outline:2px solid #efd99f;outline-offset:3px}
            @media(max-width:480px){dialog.arena-result{padding:24px 18px}.arena-result .result-title{font-size:24px}.arena-result .result-summary{padding:16px;gap:12px}.arena-result .result-summary strong{font-size:20px}.arena-result .result-table :is(th,td){padding:12px 6px}.arena-result .result-actions{flex-direction:column-reverse}.arena-result .result-actions button{width:100%}}
        `;popup.append(style);
        const mine=sorted.find(p=>p.name==='나');
        const myRank=mine?sorted.findIndex(p=>p.assets===mine.assets)+1:null;
        const title=make('h2','result-title',myRank===1?(winners.length>1?'공동 1위로 마쳤어요':'1위로 마쳤어요'):myRank?`${myRank}위로 마쳤어요`:'대결이 종료되었습니다');
        const subtitle=make('p','result-subtitle',`${room.name} · ${room.minutes}분 · 시작 자금 ${room.cash.toLocaleString()} G`);
        const tone=rate=>rate>0?'result-positive':rate<0?'result-negative':'result-neutral';
        const percent=rate=>`${rate>0?'+':''}${rate.toFixed(2)}%`;
        const summary=make('div','result-summary');
        if(mine){
            const rate=(mine.assets/room.cash-1)*100;
            for(const [label,value,cls] of [['내 최종 자산',`${Math.round(mine.assets).toLocaleString()} G`,''],['내 수익률',percent(rate),tone(rate)]]){
                const cell=make('div','');cell.append(make('span','',label),make('strong',cls,value));summary.append(cell);
            }
        }
        const table=make('table','result-table');table.setAttribute('aria-label','대결 최종 순위');
        const head=document.createElement('thead'),header=document.createElement('tr');
        for(const label of ['순위','참가자','총자산','수익률']){const cell=make('th','',label);cell.scope='col';header.append(cell);}head.append(header);table.append(head);
        const body=document.createElement('tbody');let rank=1;
        sorted.forEach((player,index)=>{
            if(index&&player.assets!==sorted[index-1].assets)rank=index+1;
            const row=make('tr',player===mine?'result-own':'');const rate=(player.assets/room.cash-1)*100;
            for(const [column,value] of [`${rank}위`,player.name,`${Math.round(player.assets).toLocaleString()} G`,percent(rate)].entries())row.append(make('td',column===3?tone(rate):column===0&&rank===1?'result-first':'',value));
            body.append(row);
        });table.append(body);
        const tableWrap=make('div','result-table-wrap');tableWrap.append(table);
        const payout=winners.some(p=>p.name==='나')?Math.floor(pot/winners.length):0;
        const note=make('p','result-note');note.append(make('strong','',`가상 배당 ${payout.toLocaleString()} G · 실제 지급 0 G`),document.createElement('br'),document.createTextNode('모의투자 결과는 실제 계좌에 반영되지 않습니다.'));
        const actions=make('div','result-actions');
        const review=make('button','','거래 화면 확인');review.onclick=()=>{popup.close();popup.remove();};
        const back=make('button','result-primary','대결 로비로 돌아가기');back.onclick=()=>{popup.close();popup.remove();match.close();};actions.append(review,back);
        popup.append(make('small','result-eyebrow','MATCH RESULT'),title,subtitle);
        if(mine)popup.append(summary);
        popup.append(make('h3','result-section-title','최종 순위'),tableWrap,note,actions);match.dialog.append(popup);
        popup.addEventListener('cancel',event=>{event.preventDefault();review.click();});popup.showModal();back.focus();
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
            const players=[{name:'나',assets:mine,forfeited:quit},{name:opponent,assets:other}];
            this.onMatchFinished?.({opponent,completed:!quit,playerAssets:mine,opponentAssets:other});
            if(quit)saveAiArenaHistory(room,players);
            else this.showResults(match,room,players);
        };
        match.onClose=()=>{finish(true);this.render();};
        match.order=side=>{if(!finished)CipherTrainingRoom.prototype.order.call(match,side);};
        const timer=setInterval(()=>{
            const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(!remaining){finish();return;}
            if(Date.now()>=nextNewsAt)publishNews();
            updateStandings(remaining);
            if(room.difficulty==='hard'){if(remaining%2===0)tradeHardArenaBot(bot,engine);}
            else if(remaining%5===0){const stocks=[...engine.stocks.values()],stock=stocks[Math.floor(Math.random()*stocks.length)];if(Math.random()<.6){const qty=Math.floor(bot.cash*.15/stock.price);if(qty>0){bot.cash-=qty*stock.price;bot.positions.set(stock.id,(bot.positions.get(stock.id)||0)+qty);}}else{const holding=[...bot.positions][0];if(holding){bot.cash+=engine.stocks.get(holding[0]).price*holding[1];bot.positions.delete(holding[0]);}}}
        },1000);
        updateStandings(room.minutes*60);engine.startEngine();match.open();
    }
}



installOnlineCompetition(CipherCompetitionRoom);
