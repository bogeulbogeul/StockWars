import { StorePlayerController } from '../store/StorePlayerController.js';
import { paintCharacterSprite } from '../CharacterSprite.js';
import { gameKey, bindingLabel } from '../../app/GameKeys.js';
import { PARK, WAREHOUSE_ENTRANCE, WAREHOUSE_PLACES, warehouseEntranceHit, createWarehouseNavigation } from './WarehouseGeometry.js';
const ROOM_URL = new URL('../../../assets/interiors/logistics/warehouse-breakroom-v5.png', import.meta.url).href;
const PARK_URL = new URL('../../../assets/characters/manager-park/park-boar-standing-v4.png', import.meta.url).href;
const PORTRAIT_URL = new URL('../../../assets/characters/manager-park/park-boar-dialogue-neutral-v1.png', import.meta.url).href;
const SMILE_URL = new URL('../../../assets/characters/manager-park/park-boar-dialogue-smile-v1.png', import.meta.url).href;
const PARK_REQUESTS = {
    challenge_logistics_s_v1: '요즘 물량이 밀려서 손 빠른 일꾼이 필요해. 한 번 일할 때 30점은 해낼 수 있겠나? S등급을 해내면 보너스도 챙겨주지.',
    challenge_flawless_v1: '이번엔 깨지기 쉬운 물건들이야. 서두르는 것보다 멀쩡히 보내는 게 중요하지. 상자 하나도 깨뜨리지 않고 한 번에 18점 이상 해보겠나?'
};
export class LogisticsWarehouse {
    constructor(container, callbacks={}) {
        this.callbacks=callbacks;this.isOpen=false;this.suspended=false;
        this.navigation=createWarehouseNavigation();this.player=new StorePlayerController();this.player.configureRoom(this.navigation);
        this.dialog=document.createElement('dialog');this.dialog.className='logistics-warehouse';this.dialog.setAttribute('aria-label','비트 물류센터 직원 휴게실');
        this.dialog.innerHTML=`<header><strong>비트 물류센터 · 직원 휴게실</strong><button type="button" data-exit>마을로 나가기 · Esc</button></header>
            <canvas width="1536" height="1024" tabindex="0" aria-label="물류센터 휴게실. WASD 이동, 박씨 아저씨 클릭 또는 가까이서 F로 대화"></canvas>
            <button type="button" class="warehouse-accessible-talk" data-talk>박씨 아저씨와 대화</button>
            <section class="warehouse-dialogue" hidden aria-label="박씨 아저씨와 대화"><div class="warehouse-portrait-frame"><div class="warehouse-portrait-crop"><img src="${PORTRAIT_URL}" alt="박씨 아저씨" draggable="false"></div></div><div class="warehouse-dialogue-content"><strong>박씨 아저씨</strong><p data-line></p><div class="npc-quest-offers" data-quest-offers hidden></div><nav aria-label="대화 선택"><button type="button" data-start>일 시작하기</button><button type="button" data-later>다음에 할게요</button></nav></div></section>
            <footer><span data-status role="status">WASD 이동 · 박씨 아저씨를 눌러 대화 · ${bindingLabel('f')} 상호작용</span><button type="button" data-near hidden></button></footer>`;
        container.append(this.dialog);this.canvas=this.dialog.querySelector('canvas');this.conversation=this.dialog.querySelector('.warehouse-dialogue');this.line=this.dialog.querySelector('[data-line]');this.status=this.dialog.querySelector('[data-status]');this.nearButton=this.dialog.querySelector('[data-near]');
        this.talkPrompt=document.createElement('button');this.talkPrompt.type='button';this.talkPrompt.className='warehouse-talk-prompt';this.talkPrompt.hidden=true;this.talkPrompt.onclick=()=>this.request(this.nearest()?.id);this.dialog.append(this.talkPrompt);
        this.requestButton=document.createElement('button');this.requestButton.type='button';this.requestButton.textContent='부탁할 일이 있나요?';this.requestButton.hidden=true;this.requestButton.onclick=()=>this.beginRequests();this.dialog.querySelector('.warehouse-dialogue nav').prepend(this.requestButton);
        this.background=new Image();this.background.src=ROOM_URL;this.npc=new Image();this.npc.src=PARK_URL;
        this.dialog.querySelector('[data-exit]').onclick=()=>this.close();
        this.dialog.querySelector('[data-talk]').onclick=()=>this.request('park');
        this.nearButton.onclick=()=>this.request(this.nearest()?.id);
        this.dialog.querySelector('[data-later]').onclick=()=>this.conversationMode==='quest'?this.nextRequest():this.dismiss();
        this.dialog.querySelector('[data-start]').onclick=()=>{
            if(this.conversationMode==='welcome')this.dismiss();
            else if(this.conversationMode==='quest')this.acceptRequest();
            else if(this.conversationMode==='accepted')this.nextRequest();
            else if(this.conversationMode==='reward')this.talk();
            else this.startWork();
        };
        this.dialog.addEventListener('cancel',e=>{e.preventDefault();if(!this.conversation.hidden)this.dismiss();else this.close();});
        this.dialog.addEventListener('keydown',e=>{
            e.stopPropagation();if(!this.conversation.hidden||e.target.closest('button'))return;
            const key=gameKey(e);if(['w','a','s','d','shift'].includes(key)){e.preventDefault();this.pending=null;this.player.keys.add(key);}
            if(key==='f'&&!e.repeat){e.preventDefault();this.request(this.nearest()?.id);}
        });
        window.addEventListener('keyup',e=>this.player.keys.delete(gameKey(e)));
        window.addEventListener('blur',()=>{this.player.stop();this.pending=null;});
        document.addEventListener('visibilitychange',()=>{if(document.hidden){this.player.stop();this.pending=null;}});
        this.dialog.addEventListener('close',()=>{if(!this.isOpen||this.dialog.open)return;this.stop();this.callbacks.onExit?.();});
        this.canvas.addEventListener('click',e=>{
            if(!this.conversation.hidden)return;const p=this.point(e);if(!p)return;
            const width=PARK.height*(this.npc.naturalWidth/this.npc.naturalHeight||.6);
            if(p.x>PARK.x-width/2&&p.x<PARK.x+width/2&&p.y>PARK.y-PARK.height&&p.y<PARK.y+10)this.request('park');
            else if(warehouseEntranceHit(p.x,p.y))this.request('exit');
            else {this.pending=null;this.player.moveTo(p.x,p.y);}this.canvas.focus({preventScroll:true});
        });
    }
    point(e) {
        const r=this.canvas.getBoundingClientRect(),scale=Math.min(r.width/1536,r.height/1024);
        const x=(e.clientX-r.left-(r.width-1536*scale)/2)/scale,y=(e.clientY-r.top-(r.height-1024*scale)/2)/scale;
        return x>=0&&x<=1536&&y>=0&&y<=1024?{x,y}:null;
    }
    nearest(){return WAREHOUSE_PLACES.find(p=>p.id==='exit'&&(warehouseEntranceHit(this.player.x,this.player.y)||Math.hypot(WAREHOUSE_ENTRANCE.x-this.player.x,WAREHOUSE_ENTRANCE.y-this.player.y)<115))||WAREHOUSE_PLACES.find(p=>p.id==='park'&&Math.hypot(PARK.x-this.player.x,PARK.y-this.player.y)<220);}
    updateTalkPrompt(near){
        this.talkPrompt.hidden=!near||!this.conversation.hidden;
        if(this.talkPrompt.hidden)return;
        this.talkPrompt.textContent=`${bindingLabel('f')} · ${near.label}`;
        const r=this.canvas.getBoundingClientRect(),d=this.dialog.getBoundingClientRect(),scale=Math.min(r.width/1536,r.height/1024);
        this.talkPrompt.style.left=`${r.left-d.left+(r.width-1536*scale)/2+this.player.x*scale}px`;
        this.talkPrompt.style.top=`${r.top-d.top+(r.height-1024*scale)/2+(this.player.y-240)*scale}px`;
    }
    request(id){const place=WAREHOUSE_PLACES.find(p=>p.id===id);if(!place||!this.conversation.hidden)return;this.player.stop();this.player.moveTo(place.x,place.y);this.pending=place;this.canvas.focus({preventScroll:true});}
    welcome(){this.dialog.querySelector('.warehouse-portrait-frame img').src=PORTRAIT_URL;this.conversationMode='welcome';this.requestButton.hidden=true;this.player.stop();this.pending=null;this.line.textContent=`비트 물류에 온 걸 환영한다! 난 이곳 담당 박씨야. 일할 준비가 됐으면 내게 다가와 말을 걸어. 나를 클릭하거나 가까이서 ${bindingLabel('f')}를 누르면 돼.`;this.dialog.querySelector('[data-quest-offers]').hidden=true;this.dialog.querySelector('[data-later]').hidden=true;this.dialog.querySelector('[data-start]').textContent='알겠어요';this.conversation.hidden=false;this.dialog.querySelector('[data-start]').focus({preventScroll:true});}
    talk(){if(this.rewardDialogue())return;this.dialog.querySelector('.warehouse-portrait-frame img').src=PORTRAIT_URL;this.conversationMode='talk';this.player.stop();this.pending=null;this.line.textContent='왔구나. 여긴 직원들 쉬는 곳이고, 뒤쪽 문 안이 작업장이야. 일할 준비가 됐으면 말해.';this.dialog.querySelector('[data-later]').hidden=false;this.dialog.querySelector('[data-later]').textContent='다음에 할게요';this.dialog.querySelector('[data-start]').textContent='일 시작하기';this.dialog.querySelector('[data-start]').removeAttribute('data-quest-accept');this.dialog.querySelector('[data-quest-offers]').hidden=true;this.requestButton.hidden=!(this.callbacks.getQuestOffers?.('park')||[]).length;this.conversation.hidden=false;this.dialog.querySelector('[data-start]').focus({preventScroll:true});}
    beginRequests(){this.requestQueue=[...(this.callbacks.getQuestOffers?.('park')||[])];this.nextRequest();}
    nextRequest(){
        this.offeredQuest=this.requestQueue?.shift();if(!this.offeredQuest){this.talk();return;}
        this.conversationMode='quest';this.requestButton.hidden=true;
        this.line.textContent=PARK_REQUESTS[this.offeredQuest.id]||this.offeredQuest.description;
        const accept=this.dialog.querySelector('[data-start]');accept.textContent='맡겨 주세요';accept.dataset.questAccept=this.offeredQuest.id;
        this.dialog.querySelector('[data-later]').hidden=false;this.dialog.querySelector('[data-later]').textContent='다음에 할게요';accept.focus({preventScroll:true});
    }
    acceptRequest(){
        const result=this.callbacks.onAcceptQuest?.(this.offeredQuest.id,'park');
        if(!result?.success){this.line.textContent='지금은 부탁을 맡길 수 없겠구나. 잠시 뒤 다시 이야기하자.';return;}
        this.requestQueue=[];this.conversationMode='accepted';this.line.textContent='좋아, 믿고 맡기마! 우선 이 부탁부터 끝내 보자. 준비되면 일을 시작해 봐. 부탁한 내용과 보상은 퀘스트창에 적어 뒀다.';
        this.dialog.querySelector('[data-start]').textContent='다음';this.dialog.querySelector('[data-start]').removeAttribute('data-quest-accept');this.dialog.querySelector('[data-later]').hidden=true;
    }
    rewardDialogue(){
        const quest=this.callbacks.getQuestReward?.();if(!quest)return false;
        const result=this.callbacks.onClaimReward?.(quest.id);if(!result?.success)return false;
        this.conversationMode='reward';this.player.stop();this.pending=null;this.requestButton.hidden=true;
        this.dialog.querySelector('.warehouse-portrait-frame img').src=SMILE_URL;
        this.line.textContent=`하하, 해낼 줄 알았다! ${quest.id==='challenge_flawless_v1'?'상자를 하나도 깨뜨리지 않다니, 믿고 맡길 수 있겠구나.':'밀린 물량을 아주 시원하게 처리했구나. 수고 많았다!'} 약속한 보상 ${quest.gold}G와 ${quest.exp} EXP다. 잘 받아 둬!`;
        this.dialog.querySelector('[data-start]').textContent='감사합니다';this.dialog.querySelector('[data-start]').removeAttribute('data-quest-accept');this.dialog.querySelector('[data-later]').hidden=true;
        this.conversation.hidden=false;this.dialog.querySelector('[data-start]').focus({preventScroll:true});return true;
    }
    dismiss(){this.conversation.hidden=true;this.canvas.focus({preventScroll:true});}
    startWork(){
        const reason=this.callbacks.getWorkBlock?.();if(reason){this.line.textContent=reason;return;}
        if(this.starting)return;this.starting=true;this.suspended=true;this.stop();this.dialog.close();
        try{this.callbacks.onStartJob?.();}finally{this.starting=false;}
    }
    stop(){this.isOpen=false;this.player.stop();this.pending=null;cancelAnimationFrame(this.frame);}
    open({resume=false}={}){
        if(this.isOpen)return;if(!resume)this.player.reset();this.suspended=false;this.conversation.hidden=true;
        this.dialog.showModal();this.isOpen=true;this.canvas.focus({preventScroll:true});if(!resume)this.welcome();this.lastFrame=performance.now();this.animate(this.lastFrame);
    }
    close(){if(!this.isOpen)return;this.stop();this.suspended=false;this.dialog.close();this.callbacks.onExit?.();}
    draw(){
        const ctx=this.canvas.getContext('2d');ctx.clearRect(0,0,1536,1024);if(this.background.complete&&this.background.naturalWidth)ctx.drawImage(this.background,0,0,1536,1024);
        const drawNpc=()=>{if(this.npc.naturalWidth){const w=PARK.height*this.npc.naturalWidth/this.npc.naturalHeight;ctx.drawImage(this.npc,PARK.x-w/2,PARK.y-PARK.height,w,PARK.height);}};
        const drawPlayer=()=>{ctx.save();ctx.translate(this.player.x,this.player.y);ctx.scale(2.4,2.4);paintCharacterSprite(ctx,0,0,{direction:this.direction||'down',moving:this.player.moving});ctx.restore();};
        if(this.player.y<PARK.y){drawPlayer();drawNpc();}else{drawNpc();drawPlayer();}
    }
    animate(now){if(!this.isOpen)return;
        if(this.conversation.hidden){const before={x:this.player.x,y:this.player.y};this.player.update((now-this.lastFrame)/1000);const dx=this.player.x-before.x,dy=this.player.y-before.y;
            if(this.player.moving)this.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
            if(this.pending&&Math.hypot(this.player.x-this.pending.x,this.player.y-this.pending.y)<6){const id=this.pending.id;this.pending=null;if(id==='park')this.talk();else{this.close();return;}}
        }
        this.lastFrame=now;const near=this.nearest();this.nearButton.hidden=true;this.updateTalkPrompt(near);
        this.canvas.dataset.playerX=this.player.x.toFixed(2);this.canvas.dataset.playerY=this.player.y.toFixed(2);this.draw();this.frame=requestAnimationFrame(t=>this.animate(t));
    }
}
