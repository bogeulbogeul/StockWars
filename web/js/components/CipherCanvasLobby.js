import { EMPTY_CHARACTER_IMAGE } from '../data/characterAsset.js';
import { paintCharacterSprite as paintDogSprite } from './CharacterSprite.js';
import {CipherRoomPackage,CIPHER_AGENT_ENABLED} from './CipherRoomPackage.js';
import {PLACES as PACKAGE_PLACES,ROOM_SIZE} from './CipherRoomPackageGeometry.js';
import { gameKey, bindingLabel } from '../app/GameKeys.js';
import { elementScale } from '../app/GameViewport.js';
import {CipherCompetitionRoom} from './CipherCompetitionRoom.js';
import {CipherTrainingRoom} from './CipherTrainingRoom.js';
import {AGENT_K_WELCOME} from './CipherAgentKDialogue.js';
import { CipherTour, CIPHER_TOUR_KEY } from './tutorial/cipherTour.js';
import {StorePlayerController} from './store/StorePlayerController.js';
import {AGENT_K_PORTRAIT_URL as agentKPortraitUrl} from './CipherAgentK.js';
export class CipherLobby {
    constructor(container) {
        this.isOpen=false;
        this.showGrid=false;

        this.dialog=document.createElement('dialog');
        this.dialog.className='cipher-lobby';
        this.dialog.setAttribute('aria-label','사이퍼 증권 로비');
        this.dialog.innerHTML=`<div class="cipher-lobby-header"><span>사이퍼 증권 · 1층 로비</span><button class="cipher-arrange" aria-expanded="false">가구 정리</button><button class="cipher-grid-toggle" aria-pressed="false">그리드 확인</button><button class="cipher-lobby-exit">마을로 나가기 · Esc</button></div><canvas class="cipher-lobby-shell" width="1448" height="1086" role="img" aria-label="벽과 바닥이 연결된 증권사 룸"></canvas><p class="cipher-lobby-error" hidden>룸 에셋을 불러오지 못했습니다.</p>`;
        container.appendChild(this.dialog);

        this.canvas=this.dialog.querySelector('canvas');
        this.dialog.querySelector('.cipher-lobby-exit').onclick=()=>this.close();
        const guideButton=document.createElement('button');
        guideButton.textContent='이용 안내';
        guideButton.onclick=()=>{
            if(this.editor.active)return;
            this.player.stop();this.startAgentIntroduction();
        };
        this.dialog.querySelector('.cipher-lobby-header').insertBefore(guideButton,this.dialog.querySelector('.cipher-lobby-exit'));
        // The approved lobby layout is fixed; retain only its title in the header.
        this.dialog.querySelectorAll('.cipher-lobby-header button').forEach(button=>button.hidden=true);
        guideButton.hidden=false;
        guideButton.style.cssText='position:absolute;right:20px;top:20px;z-index:9;padding:10px 16px;border:1px solid #dcae39;border-radius:9px;background:#102333;color:#ffe1a1;font:inherit;cursor:pointer';
        this.dialog.append(guideButton);
        this.dialog.querySelector('.cipher-grid-toggle').onclick=e=>{
            this.showGrid=!this.showGrid;
            e.currentTarget.setAttribute('aria-pressed',String(this.showGrid));
            this.draw();
        };
        this.trainingRoom=new CipherTrainingRoom(container);this.trainingRoom.onClose=()=>{this.canvas.focus();this.lastFrame=performance.now();this.animate(this.lastFrame);};
        this.competitionRoom=new CipherCompetitionRoom(container);this.competitionRoom.onClose=this.trainingRoom.onClose;
        this.tour=new CipherTour(this);
        this.roomPackage=new CipherRoomPackage(this);

        // Preserve the legacy layout save; existing social integrations still read this interface.
        this.editor={active:false,items:[{id:'package-exit',asset:'carpet'}]};
        this.player=new StorePlayerController();
        this.navigation=this.roomPackage.navigation;
        this.player.configureRoom(this.navigation);
        this.canvas.tabIndex=0;
        this.canvas.setAttribute('aria-label','증권사 내부 · WASD 이동, 바닥 클릭 이동, 카펫 근처 F로 퇴장');
        this.hint=document.createElement('p');this.hint.className='cipher-movement-hint';this.hint.style.cssText='position:absolute;bottom:8px;left:16px;color:#fff2d9;pointer-events:none;font-size:13px';this.dialog.append(this.hint);
        this.exitPrompt=document.createElement('button');this.exitPrompt.hidden=true;this.exitPrompt.textContent='마을로 나가기 · '+bindingLabel('f');this.exitPrompt.style.cssText='position:absolute;transform:translate(-50%,-100%);white-space:nowrap;width:max-content;max-width:none;flex-shrink:0;padding:10px 16px;border:1px solid #f0ca65;border-radius:9px;background:#102b45;color:#fff2d9;font-size:14px;font-weight:700;box-shadow:0 4px 14px #0006;cursor:pointer;z-index:5';this.exitPrompt.onclick=()=>{if(this.nearExit())this.close();};this.dialog.append(this.exitPrompt);
        this.stairPrompt=this.exitPrompt.cloneNode(false);this.stairPrompt.textContent='엘리베이터 이용 · '+bindingLabel('f');this.stairPrompt.onclick=()=>{if(this.nearStairs()){this.roomPackage.request('elevator');this.canvas.focus();}};this.dialog.append(this.stairPrompt);this.talkPrompt=this.exitPrompt.cloneNode(false);this.talkPrompt.textContent='대화하기 · '+bindingLabel('f');this.talkPrompt.onclick=()=>this.talkToAgentK();this.dialog.append(this.talkPrompt);this.doorPrompt=document.createElement('button');this.doorPrompt.hidden=true;this.doorPrompt.style.cssText=this.exitPrompt.style.cssText+';cursor:pointer';this.doorPrompt.onclick=()=>this.enterTrainingRoom();this.dialog.append(this.doorPrompt);
        this.notice=document.createElement('div');this.notice.className='cipher-notice';this.notice.hidden=true;this.notice.setAttribute('role','alert');this.notice.style.cssText='position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);padding:24px;background:#102b45;color:#fff2d9;border:2px solid #e5b838;border-radius:12px;z-index:10;text-align:center';this.notice.innerHTML='<p style="margin:0 0 20px;line-height:1.6">회원이 아닙니다. 위층은 회원 전용 공간입니다.</p><button class="cipher-notice-confirm" style="min-width:112px;padding:10px 28px;border:1px solid #ffe398;border-radius:8px;background:linear-gradient(180deg,#f3cf70,#d9aa38);color:#102b45;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 3px 0 #916d20,0 5px 12px #0004">확인</button>';this.notice.style.maxWidth='min(480px,85vw)';this.noticeHeading=document.createElement('strong');this.noticeHeading.style.cssText='display:block;margin-bottom:12px;color:#f3cf70;font-size:17px';this.noticeHeading.hidden=true;this.notice.prepend(this.noticeHeading);this.notice.querySelector('button').onclick=()=>this.advanceNotice();this.dialog.append(this.notice);this.defaultNoticeHTML=this.notice.innerHTML;this.defaultNoticeStyle=this.notice.style.cssText;
        this.sitPrompt=this.exitPrompt.cloneNode(false);this.sitPrompt.textContent='앉기 · '+bindingLabel('f');this.sitPrompt.onclick=()=>this.toggleSitting();this.dialog.append(this.sitPrompt);
        this.dialog.addEventListener('keydown',e=>{if(!this.isOpen)return;if(!this.notice.hidden){if(e.target.closest('button')&&['enter',' '].includes(gameKey(e))){e.stopPropagation();return;}e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&['enter','escape'].includes(gameKey(e)))this.advanceNotice(gameKey(e)==='escape');return;}e.stopPropagation();if(this.editor.active)return;if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const key=gameKey(e);if(['w','a','s','d','shift'].includes(key)){e.preventDefault();e.stopImmediatePropagation();this.standUp();this.player.keys.add(key);}else if(key==='f'&&!e.repeat){if(this.seated||this.nearbySeat()){e.preventDefault();this.toggleSitting();}else if(this.nearAgentK()){e.preventDefault();this.talkToAgentK();}else if(this.nearStairs()){e.preventDefault();this.roomPackage.request('elevator');}else if(this.nearbyRoomDoor()){e.preventDefault();this.enterTrainingRoom();}else if(this.nearExit()){e.preventDefault();this.close();}}});
        window.addEventListener('keyup',e=>this.player.keys.delete(gameKey(e)));
        window.addEventListener('blur',()=>this.player.stop());
        document.addEventListener('visibilitychange',()=>{if(document.hidden)this.player.stop();});


        this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();});
        this.dialog.addEventListener('close',()=>{this.roomPackage.close();this.hideAgentWelcome();this.isOpen=false;this.player.stop();cancelAnimationFrame(this.frame);});
        if(new URLSearchParams(location.search).get('cipherGrid')==='1') requestAnimationFrame(()=>{
            this.open();
        });
    }
    draw(){
        if(!this.player||!this.notice)return;
        // Recheck DPR during playback too (e.g. moving to another monitor).
        this.roomPackage.syncResolution();
        const ctx=this.canvas.getContext('2d');
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        const scale=Math.min(this.canvas.width/ROOM_SIZE.width,this.canvas.height/ROOM_SIZE.height);
        ctx.save();
        ctx.setTransform(scale,0,0,scale,(this.canvas.width-ROOM_SIZE.width*scale)/2,(this.canvas.height-ROOM_SIZE.height*scale)/2);
        ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
        this.roomPackage.draw(ctx);ctx.restore();
    }
    ensurePlayer(){if(!this.navigation.isWalkable(this.player.x,this.player.y))Object.assign(this.player,this.navigation.clamp(this.player.x,this.player.y));}
    nearExit(){return this.roomPackage?this.roomPackage.near('exit'):this.player.nearby()?.action==='exit';}
    nearAgentK(){return CIPHER_AGENT_ENABLED&&this.roomPackage.near('agent',72);}
    talkToAgentK(){
        if(!this.nearAgentK()||this.editor.active||this.tour?.active)return;
        this.player.stop();
        let introduced=this.agentKIntroduced;
        try{introduced||=localStorage.getItem('stockwars.cipher.agent-k.introduced')==='1'||localStorage.getItem(CIPHER_TOUR_KEY)==='1';}catch{}
        if(introduced)this.renderAgentChoices();
        else{
            this.agentKIntroduced=true;
            try{localStorage.setItem('stockwars.cipher.agent-k.introduced','1');}catch{}
            this.startAgentIntroduction();
            return;
        }
        this.notice.hidden=false;this.notice.querySelector('button').focus();
    }
    showAgentWelcome(){
        this.hideAgentWelcome();
        if(!this.welcomeBubble){
            const bubble=document.createElement('div');bubble.className='cipher-welcome-dialogue';bubble.setAttribute('role','status');
            bubble.innerHTML=`<img src="${agentKPortraitUrl}" alt="토리"><div><strong>토리</strong><p>사이퍼 증권에 오신 것을 환영합니다.<br>도움이 필요하시면 저에게 말을 걸어주세요.</p></div>`;
            const style=document.createElement('style');style.textContent=`
                .cipher-welcome-dialogue{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);z-index:10;display:flex;align-items:center;gap:18px;width:min(580px,90%);padding:16px 22px 16px 16px;box-sizing:border-box;border:1px solid #70e3d580;border-radius:16px;background:#102332f5;box-shadow:0 10px 32px #0008;color:#f1f8ff;pointer-events:none}
                .cipher-welcome-dialogue[hidden]{display:none}.cipher-welcome-dialogue img{flex:0 0 80px;width:80px;height:96px;object-fit:cover;object-position:top;border-radius:12px;background:#1a3b46}.cipher-welcome-dialogue>div{min-width:0}.cipher-welcome-dialogue strong{color:#8ceddd;font-size:14px}.cipher-welcome-dialogue p{margin:8px 0 0;font-size:15px;line-height:1.7;overflow-wrap:anywhere}
                @media(max-width:520px){.cipher-welcome-dialogue{bottom:12px;gap:12px;padding:12px}.cipher-welcome-dialogue img{flex-basis:60px;width:60px;height:76px}.cipher-welcome-dialogue p{font-size:13px}}
            `;
            bubble.append(style);this.dialog.append(bubble);this.welcomeBubble=bubble;
        }
        this.welcomeBubble.hidden=false;
        this.welcomeTimer=setTimeout(()=>this.hideAgentWelcome(),5000);
    }
    hideAgentWelcome(){
        clearTimeout(this.welcomeTimer);
        if(this.welcomeBubble)this.welcomeBubble.hidden=true;
    }
    startAgentIntroduction(){
        this.hideAgentWelcome();if(this.roomPackage)this.roomPackage.pending=null;this.notice.hidden=true;this.agentChoiceMode=false;
        this.agentKIntroduced=true;
        try{localStorage.setItem('stockwars.cipher.agent-k.introduced','1');}catch{}
        this.tour.start();
    }
    renderAgentMenu(text,options){
        if(this.tour?.active)this.tour.stop();
        this.hideAgentWelcome();this.restoreNotice();this.dialoguePage=null;this.agentChoiceMode=true;
        this.notice.classList.add('cipher-agent-menu');this.notice.style.cssText='';
        this.notice.innerHTML=`<img class="cipher-agent-portrait" src="${agentKPortraitUrl}" alt="토리"><div class="cipher-dialogue-body"><div class="cipher-agent-identity"><strong>토리</strong><span>Cipher Securities</span></div><p class="cipher-dialogue-text"></p><div class="cipher-agent-actions"></div></div>`;
        this.notice.querySelector('.cipher-dialogue-text').textContent=text;
        const choices=this.notice.querySelector('.cipher-agent-actions');
        for(const [label,action,primary=false] of options){
            const button=document.createElement('button');button.textContent=label;button.onclick=action;
            if(primary)button.className='cipher-agent-primary';choices.append(button);
        }
        this.notice.hidden=false;choices.querySelector('button')?.focus();
    }
    renderAgentChoices(){
        const reward=this.getQuestReward?.();
        if(reward&&this.onClaimReward?.(reward.id)?.success){
            this.renderAgentMenu(`하하, 이번 승부는 당신의 승리군요. 마지막까지 자산을 지켜 낸 판단이 훌륭했습니다. 약속한 ${reward.gold}G와 ${reward.exp} EXP입니다. 다음 대결도 기대하겠습니다.`,[['감사합니다',()=>this.renderAgentChoices(),true]]);
            this.notice.querySelector('.cipher-agent-portrait').src=EMPTY_CHARACTER_IMAGE;
            return;
        }
        this.renderAgentMenu('다시 찾아주셨군요. 무엇을 도와드릴까요?',[
            ['토리와 연습 대결',()=>this.startAgentPractice(),true],
            ...(this.getQuestOffers?.('agent_k')?.length ? [['의뢰 확인',()=>this.renderAgentQuestOffer()]] : []),
            ['궁금한 게 있어요',()=>this.renderAgentQuestions()],
            ['옵시디언 회원 안내',()=>this.renderAgentMembership()],
            ['대화 마치기',()=>this.advanceNotice(true)]
        ]);
    }
    renderAgentQuestOffer(){
        const quest=this.getQuestOffers?.('agent_k')?.[0];
        if(!quest){this.renderAgentChoices();return;}
        this.renderAgentMenu('이제 배운 것을 실전에서 시험해 볼 때군요. 저와 모의투자로 겨뤄 보시겠습니까? 제한 시간이 끝났을 때 총자산이 저보다 많으면 당신의 승리입니다. 무승부나 중도 포기는 인정하지 않겠습니다. 이기면 다시 찾아오세요. 보상을 준비해 두죠.',[
            ['맡겨 주세요',()=>{if(!this.onAcceptQuest?.(quest.id,'agent_k')?.success)return;this.renderAgentMenu('좋습니다. 준비되면 저에게 연습 대결을 신청하세요. 승부가 끝나면 다시 이야기를 나눕시다.',[['알겠습니다',()=>this.renderAgentChoices(),true]]);},true],
            ['나중에 할게요',()=>this.renderAgentChoices()]
        ]);
    }
    startAgentPractice(){
        this.advanceNotice(true);this.player.stop();cancelAnimationFrame(this.frame);
        this.competitionRoom.open({skipTutorial:true});
        this.competitionRoom.start({id:crypto.randomUUID(),name:'토리와 무료 대결',minutes:3,cash:100000,stake:0,opponent:'토리',difficulty:'hard'});
    }
    renderAgentQuestions(){
        this.renderAgentMenu('궁금한 내용을 골라주세요. 필요한 부분만 짧게 안내해 드리겠습니다.',[
            ['거래 수수료',()=>this.renderAgentAnswer('증권사 거래의 기본 수수료는 0.01%입니다. 적용 중인 효과와 주문에 따라 실제 금액은 달라질 수 있으니, 거래 전에 예상 주문 금액의 수수료를 확인하세요.')],
            ['대결 규칙',()=>this.renderAgentAnswer('같은 시작 자금과 시장 조건으로 거래하고, 제한 시간이 끝났을 때 총자산으로 순위를 정합니다. 대결 자금과 가상 배당은 실제 계좌에 반영되지 않습니다. 중도 포기는 전적에 기록되며, 온라인 대결에서는 포기 후 관전할 수 있습니다.')],
            ['트레이닝과 모의투자의 차이',()=>this.renderAgentAnswer('트레이닝룸은 평소 게임 계좌로 거래하는 공간입니다. 모의투자는 대결 전용 가상 계좌를 사용하므로 실제 계좌에 영향을 주지 않습니다. 부담 없이 연습하고 싶다면 저와 무료 대결을 해보세요.')],
            ['처음 선택지로',()=>this.renderAgentChoices()]
        ]);
    }
    renderAgentAnswer(text){
        this.renderAgentMenu(text,[['다른 질문 보기',()=>this.renderAgentQuestions(),true],['대화 마치기',()=>this.advanceNotice(true)]]);
    }
    renderAgentMembership(){
        this.renderAgentMenu('엘리베이터로 연결되는 위층은 옵시디언 회원 전용 공간입니다. 회원 가입 절차와 이용 조건은 현재 준비 중이며, 조건과 혜택이 정해지면 안내해 드리겠습니다.',[
            ['선택지로 돌아가기',()=>this.renderAgentChoices(),true],['대화 마치기',()=>this.advanceNotice(true)]
        ]);
    }
    renderAgentDialogue(){
        this.notice.onclick=e=>{
            if(e.target.closest('button')||!Number.isInteger(this.dialoguePage))return;
            this.advanceNotice();
        };
        if(!this.notice.querySelector('.cipher-dialogue-text')){
            this.notice.style.cssText='position:absolute;left:20px;right:20px;bottom:20px;top:auto;padding:16px 20px;background:rgba(12,13,17,.97);color:#fff2d9;border:2px solid #dcae39;border-radius:16px;z-index:10;box-shadow:0 10px 35px #0008;display:flex;gap:18px;align-items:center;text-align:left';
            this.notice.innerHTML=`<img class="cipher-agent-portrait" src="${agentKPortraitUrl}" alt="토리"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px"><strong style="color:#f3cf70;border:1px solid #3a8190;border-radius:20px;padding:6px 12px;background:#102b35">● 토리 <small style="margin-left:8px;color:#c4b575">Cipher Securities</small></strong><div style="display:flex;gap:6px"><button data-dialogue="collapse" aria-label="대화창 접기" style="padding:5px 10px;border:1px solid #665740;border-radius:6px;background:#25222a;color:#f1d995">−</button><button data-dialogue="skip" style="padding:5px 10px;border:1px solid #665740;border-radius:6px;background:#25222a;color:#c4b9a4">⏩ 스킵</button><button data-dialogue="next" style="padding:5px 12px;border:1px solid #c69a27;border-radius:6px;background:#493409;color:#ffd35f;font-weight:700">다음 ▶</button></div></div><div class="cipher-dialogue-body"><p class="cipher-dialogue-text" style="margin:0;line-height:1.7;font-size:15px;font-weight:600"></p><div style="display:flex;justify-content:space-between;color:#e5ba42;font-size:12px;margin-top:12px"><span class="cipher-dialogue-progress"></span><span>▼</span></div></div></div>`;
            this.notice.querySelector('[data-dialogue=next]').onclick=()=>this.advanceNotice();
            this.notice.querySelector('[data-dialogue=skip]').onclick=()=>this.advanceNotice(true);
            this.notice.querySelector('[data-dialogue=collapse]').onclick=e=>{const body=this.notice.querySelector('.cipher-dialogue-body');body.hidden=!body.hidden;e.target.textContent=body.hidden?'+':'−';};
        }
        this.notice.querySelector('.cipher-dialogue-text').textContent=AGENT_K_WELCOME[this.dialoguePage];
        this.notice.querySelector('.cipher-dialogue-progress').textContent='';
        this.notice.querySelector('[data-dialogue=next]').textContent=this.dialoguePage===AGENT_K_WELCOME.length-1?'대화 마치기':'다음 ▶';
    }
    restoreNotice(){
        this.notice.classList.remove('cipher-agent-menu');
        this.agentChoiceMode=false;
        this.notice.onclick=null;
        this.notice.innerHTML=this.defaultNoticeHTML;this.notice.style.cssText=this.defaultNoticeStyle;
        this.noticeHeading=this.notice.querySelector('strong');this.noticeHeading.hidden=true;
        this.notice.querySelector('button').onclick=()=>this.advanceNotice();
    }
    advanceNotice(cancel=false){
        if(this.agentChoiceMode&&!cancel)return;
        if(!cancel&&Number.isInteger(this.dialoguePage)&&this.dialoguePage<AGENT_K_WELCOME.length-1){this.dialoguePage++;this.renderAgentDialogue();return;}
        this.dialoguePage=null;this.restoreNotice();this.notice.hidden=true;this.canvas.focus();
    }
    nearStairs(){return this.roomPackage?this.roomPackage.near('elevator'):false;}
    showMembershipNotice(){
        this.player.stop();this.stairAttempt=false;this.stairNotified=true;
        this.renderAgentMenu('잠시만요. 엘리베이터로 연결되는 위층은 옵시디언 회원 전용 공간입니다. 아직 회원이 아니셔서 지금은 이용하실 수 없습니다.',[
            ['알겠어요',()=>this.advanceNotice(true),true]
        ]);
    }
    movePlayerTo(p){this.roomPackage.moveTo(p);}
    paintPlayer(ctx,pose=this.player,nickname=''){
        const roomScale=this.roomPackage?.scale||1;
        ctx.save();ctx.translate(pose.x,pose.y);ctx.scale(1/roomScale,1/roomScale);
        // Align the integrated seated sprite with this room's sofa cushion.
        if (pose===this.player ? this.seated : pose.resting) ctx.translate(0,24);
        paintDogSprite(ctx, 0, 0, { direction: pose.facing < 0 ? 'left' : 'right', moving: !!pose.moving || !!pose.phase, seated: pose===this.player ? !!this.seated : !!pose.resting });
        if(nickname){ctx.save();ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillStyle='#6eeaff';ctx.fillText(nickname,0,-108);ctx.restore();}
        ctx.restore();
    }
    nearbySeat(){return this.roomPackage.nearbySeat();}
    toggleSitting(){
        if(this.editor.active||!this.notice.hidden||this.stairMotion)return;
        if(this.seated){this.standUp();return;}
        const seat=this.nearbySeat();if(!seat)return;
        this.player.stop();this.standPosition={x:this.player.x,y:this.player.y};this.seated=seat;
        this.player.x=seat.x;this.player.y=seat.y;this.canvas.focus();
    }
    standUp(){
        if(!this.seated)return;
        this.seated=null;Object.assign(this.player,this.standPosition);this.ensurePlayer();this.canvas.focus();
    }
    enterTrainingRoom(){const door=this.nearbyRoomDoor();if(!door)return;this.hideAgentWelcome();this.player.stop();this.roomPackage.pending=null;cancelAnimationFrame(this.frame);if(door.label==='트레이닝룸 이동')this.trainingRoom.open();else this.competitionRoom.open();}
    nearbyRoomDoor(){return PACKAGE_PLACES.find(p=>['training','competition'].includes(p.id)&&this.roomPackage.near(p.id));}
    updateExitPrompt(){
        const prompts=[this.exitPrompt,this.stairPrompt,this.talkPrompt,this.sitPrompt,this.doorPrompt];
        prompts.forEach(p=>p.hidden=true);
        if(!this.isOpen||!this.notice.hidden||this.tour?.active)return;
        const door=this.nearbyRoomDoor();let prompt,label;
        if(this.seated||this.nearbySeat()){prompt=this.sitPrompt;label=this.seated?'일어나기':'앉기';}
        else if(this.nearAgentK()){prompt=this.talkPrompt;label='대화하기';}
        else if(this.nearStairs()){prompt=this.stairPrompt;label='엘리베이터 이용';}
        else if(door){prompt=this.doorPrompt;label=door.label;}
        else if(this.nearExit()){prompt=this.exitPrompt;label='마을로 나가기';}
        if(!prompt)return;
        prompt.hidden=false;prompt.textContent=label+' · '+bindingLabel('f');
        const canvas=this.canvas.getBoundingClientRect(),dialog=this.dialog.getBoundingClientRect(),uiScale=elementScale(this.dialog);
        const scale=Math.min(canvas.width/ROOM_SIZE.width,canvas.height/ROOM_SIZE.height);
        prompt.style.left=`${(canvas.left-dialog.left+(canvas.width-ROOM_SIZE.width*scale)/2+this.player.x*scale)/uiScale}px`;
        prompt.style.top=`${(canvas.top-dialog.top+(canvas.height-ROOM_SIZE.height*scale)/2+(this.player.y-120/this.roomPackage.scale)*scale)/uiScale}px`;
    }
    animate(now){
        if(!this.isOpen)return;
        if(this.notice.hidden&&!this.tour?.active){
            if(!this.seated){this.ensurePlayer();this.player.update((now-this.lastFrame)/1000);}
            this.roomPackage.update();
        }else this.player.stop();
        if(!this.isOpen)return;
        this.lastFrame=now;
        this.canvas.dataset.playerX=this.player.x.toFixed(2);this.canvas.dataset.playerY=this.player.y.toFixed(2);
        this.updateExitPrompt();this.draw();
        if(!this.trainingRoom.dialog.open&&!this.competitionRoom.dialog.open)this.frame=requestAnimationFrame(t=>this.animate(t));
    }
    open(){if(this.isOpen)return;this.dialog.showModal();this.isOpen=true;this.restoreNotice();this.dialoguePage=null;this.notice.hidden=true;this.stairMotion=null;this.stairNotified=false;this.stairAttempt=false;this.seated=null;this.player.reset();this.ensurePlayer();this.roomPackage?.open();this.lastFrame=performance.now();this.canvas.focus();this.animate(this.lastFrame);let seen=!!this.agentKIntroduced;try{seen||=localStorage.getItem(CIPHER_TOUR_KEY)==='1'||localStorage.getItem('stockwars.cipher.agent-k.introduced')==='1';}catch{}if(CIPHER_AGENT_ENABLED){if(!seen)this.startAgentIntroduction();else this.showAgentWelcome();}}
    close(){this.hideAgentWelcome();this.tour?.stop();if(this.editor.active)this.editor.cancel();this.dialog.close();this.isOpen=false;}
}















