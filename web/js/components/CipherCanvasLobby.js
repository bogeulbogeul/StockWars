import { gameKey } from '../app/GameKeys.js';
import { elementScale } from '../app/GameViewport.js';
import {CipherCompetitionRoom} from './CipherCompetitionRoom.js';
import {CipherTrainingRoom} from './CipherTrainingRoom.js';
import {AGENT_K_WELCOME,AGENT_K_HIGHLIGHTS} from './CipherAgentKDialogue.js';
import {marketEngine} from '../engine/marketEngine.js';
import { CipherRoomEditor, cipherFurnitureSize } from './CipherRoomEditor.js';
import {StorePlayerController} from './store/StorePlayerController.js';
import {createCipherNavigation,cipherScreenToGrid,CIPHER_STAIR_LANDING} from './CipherNavigation.js';
import { CIPHER_FLOOR, CIPHER_GRID_LINES, cipherGridToScreen } from './CipherGrid.js';
import {cipherDrawOrder,cipherDepthCompare} from './CipherDepth.js';
import {paintGuidePreview,drawCipherRoomImage,cipherWallPoint} from './CipherGuidePreview.js';
import {cipherRasterRect,CIPHER_FURNITURE_RASTERS} from './CipherFurnitureRaster.js';
const agentKPortraitUrl = new URL('../../assets/characters/agent-k/agent-k-dialogue-smile-v1.png?portrait=hd1', import.meta.url).href;
export class CipherLobby {
    constructor(container) {
        this.isOpen=false;
        this.showGrid=false;

        this.dialog=document.createElement('dialog');
        this.dialog.className='cipher-lobby';
        this.dialog.setAttribute('aria-label','사이퍼 증권 로비');
        this.dialog.innerHTML=`<div class="cipher-lobby-header"><span>사이퍼 증권 · 1층 로비</span><button class="cipher-arrange" aria-expanded="false">가구 정리</button><button class="cipher-grid-toggle" aria-pressed="false">그리드 확인</button><button class="cipher-lobby-exit">마을로 나가기 · Esc</button></div><canvas class="cipher-lobby-shell" width="1448" height="1086" role="img" aria-label="벽과 바닥이 연결된 증권사 룸"></canvas><p class="cipher-lobby-error" hidden>룸 에셋을 불러오지 못했습니다.</p>`;
        container.appendChild(this.dialog);
        // Keep reusable furnishing tools available through an explicit development option.
        this.dialog.classList.toggle('cipher-furniture-tools',new URLSearchParams(location.search).get('furnitureTools')==='1');
        this.canvas=this.dialog.querySelector('canvas');
        this.wall=new Image();
        this.wall.onload=()=>this.draw();
        this.wall.onerror=()=>{this.dialog.querySelector('.cipher-lobby-error').hidden=false;};
        this.wall.src='./assets/interiors/cipher/cipher-room-elevator-grid-v5-candidate.png';
        this.marbleFloor=new Image();
        this.marbleFloor.onload=()=>{this.roomRaster=null;this.draw();};
        this.marbleFloor.src='./assets/interiors/cipher/cipher-room-marble-seamless-v2.png';
        this.dialog.querySelector('.cipher-lobby-exit').onclick=()=>this.close();
        const guideButton=document.createElement('button');
        guideButton.textContent='이용 안내';
        guideButton.onclick=()=>{
            if(this.editor.active)return;
            this.player.stop();this.startAgentIntroduction();
            this.notice.hidden=false;this.notice.querySelector('button').focus();
        };
        this.dialog.querySelector('.cipher-lobby-header').insertBefore(guideButton,this.dialog.querySelector('.cipher-lobby-exit'));
        // The approved lobby layout is fixed; retain only its title in the header.
        this.dialog.querySelectorAll('.cipher-lobby-header button').forEach(button=>button.hidden=true);
        this.dialog.querySelector('.cipher-grid-toggle').onclick=e=>{
            this.showGrid=!this.showGrid;
            e.currentTarget.setAttribute('aria-pressed',String(this.showGrid));
            this.draw();
        };
        this.trainingRoom=new CipherTrainingRoom(container);this.trainingRoom.onClose=()=>{this.canvas.focus();this.lastFrame=performance.now();this.animate(this.lastFrame);};
        this.competitionRoom=new CipherCompetitionRoom(container);this.competitionRoom.onClose=this.trainingRoom.onClose;
        this.editor=new CipherRoomEditor(this);
        this.player=new StorePlayerController();
        this.navigation=createCipherNavigation(()=>this.editor.items,cipherFurnitureSize);
        this.player.configureRoom(this.navigation);
        this.canvas.tabIndex=0;
        this.canvas.setAttribute('aria-label','증권사 내부 · WASD 이동, 바닥 클릭 이동, 카펫 근처 F로 퇴장');
        this.hint=document.createElement('p');this.hint.className='cipher-movement-hint';this.hint.style.cssText='position:absolute;bottom:8px;left:16px;color:#fff2d9;pointer-events:none;font-size:13px';this.dialog.append(this.hint);
        this.exitPrompt=document.createElement('button');this.exitPrompt.hidden=true;this.exitPrompt.textContent='마을로 나가기 · F';this.exitPrompt.style.cssText='position:absolute;transform:translate(-50%,-100%);white-space:nowrap;width:max-content;max-width:none;flex-shrink:0;padding:10px 16px;border:1px solid #f0ca65;border-radius:9px;background:#102b45;color:#fff2d9;font-size:14px;font-weight:700;box-shadow:0 4px 14px #0006;cursor:pointer;z-index:5';this.exitPrompt.onclick=()=>{if(this.nearExit())this.close();};this.dialog.append(this.exitPrompt);
        this.stairPrompt=this.exitPrompt.cloneNode(false);this.stairPrompt.textContent='엘리베이터 이용 · F';this.stairPrompt.onclick=()=>{if(this.nearStairs()){this.stairAttempt=true;this.player.moveTo(CIPHER_STAIR_LANDING.x,CIPHER_STAIR_LANDING.y);this.canvas.focus();}};this.dialog.append(this.stairPrompt);this.talkPrompt=this.exitPrompt.cloneNode(false);this.talkPrompt.textContent='대화하기 · F';this.talkPrompt.onclick=()=>this.talkToAgentK();this.dialog.append(this.talkPrompt);this.doorPrompt=document.createElement('button');this.doorPrompt.hidden=true;this.doorPrompt.style.cssText=this.exitPrompt.style.cssText+';cursor:pointer';this.doorPrompt.onclick=()=>this.enterTrainingRoom();this.dialog.append(this.doorPrompt);
        this.notice=document.createElement('div');this.notice.hidden=true;this.notice.setAttribute('role','alert');this.notice.style.cssText='position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);padding:24px;background:#102b45;color:#fff2d9;border:2px solid #e5b838;border-radius:12px;z-index:10;text-align:center';this.notice.innerHTML='<p style="margin:0 0 20px;line-height:1.6">회원이 아닙니다. 2층은 회원 전용 공간입니다.</p><button class="cipher-notice-confirm" style="min-width:112px;padding:10px 28px;border:1px solid #ffe398;border-radius:8px;background:linear-gradient(180deg,#f3cf70,#d9aa38);color:#102b45;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 3px 0 #916d20,0 5px 12px #0004">확인</button>';this.notice.style.maxWidth='min(480px,85vw)';this.noticeHeading=document.createElement('strong');this.noticeHeading.style.cssText='display:block;margin-bottom:12px;color:#f3cf70;font-size:17px';this.noticeHeading.hidden=true;this.notice.prepend(this.noticeHeading);this.notice.querySelector('button').onclick=()=>this.advanceNotice();this.dialog.append(this.notice);this.defaultNoticeHTML=this.notice.innerHTML;this.defaultNoticeStyle=this.notice.style.cssText;
        this.sitPrompt=this.exitPrompt.cloneNode(false);this.sitPrompt.textContent='앉기 · F';this.sitPrompt.onclick=()=>this.toggleSitting();this.dialog.append(this.sitPrompt);
        this.dialog.addEventListener('keydown',e=>{if(!this.isOpen)return;if(!this.notice.hidden){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&['enter','escape'].includes(gameKey(e)))this.advanceNotice(gameKey(e)==='escape');return;}e.stopPropagation();if(this.editor.active)return;if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const key=gameKey(e);if(['w','a','s','d','shift'].includes(key)){e.preventDefault();e.stopImmediatePropagation();this.standUp();this.player.keys.add(key);}else if(key==='f'&&!e.repeat){if(this.seated||this.nearbySeat()){e.preventDefault();this.toggleSitting();}else if(this.nearAgentK()){e.preventDefault();this.talkToAgentK();}else if(this.nearStairs()){e.preventDefault();this.stairAttempt=true;this.player.moveTo(CIPHER_STAIR_LANDING.x,CIPHER_STAIR_LANDING.y);}else if(this.nearbyRoomDoor()){e.preventDefault();this.enterTrainingRoom();}else if(this.nearExit()){e.preventDefault();this.close();}}});
        window.addEventListener('keyup',e=>this.player.keys.delete(gameKey(e)));
        window.addEventListener('blur',()=>this.player.stop());
        document.addEventListener('visibilitychange',()=>{if(document.hidden)this.player.stop();});
        marketEngine.subscribe(()=>{this.sceneLayers=null;this.sceneLayerCache=null;});
        this.dialog.querySelector('.cipher-arrange').onclick=e=>{this.standUp();this.player.stop();if(this.editor.active){this.editor.cancel();this.ensurePlayer();}else{e.currentTarget.setAttribute('aria-expanded','true');this.editor.begin();}};
        this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();});
        this.dialog.addEventListener('close',()=>{this.isOpen=false;this.player.stop();cancelAnimationFrame(this.frame);});
        if(new URLSearchParams(location.search).get('cipherGrid')==='1') requestAnimationFrame(()=>{
            this.open();
        });
    }
    draw(){
        const ctx=this.canvas.getContext('2d');
        ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        if(this.editor?.active){
            paintGuidePreview(ctx,this.editor.items,cipherFurnitureSize,this.editor.selected,this.wall,this.marbleFloor,this.showGrid);
            this.editor.paint(ctx);
            return;
        }
        if(!this.wall.complete||!this.wall.naturalWidth)return;
        // The room includes its floor and trim; render once at the original ratio.
        if(!this.roomRaster){
            this.roomRaster=document.createElement('canvas');this.roomRaster.width=this.canvas.width;this.roomRaster.height=this.canvas.height;
            drawCipherRoomImage(this.roomRaster.getContext('2d'),this.wall,this.marbleFloor);
        }
        ctx.drawImage(this.roomRaster,0,0);
        if(this.remotePlayers?.length&&!this.showGrid){
            const actors=[{...this.playerItem(),pose:this.player},...this.remotePlayers.map(p=>{const g=cipherScreenToGrid(p.x,p.y),seat=p.resting&&this.editor.items.find(i=>i.asset==='sofa'&&`sofa:${i.u}:${i.v}:${i.rotation||0}`===p.seatId);return {asset:'player',u:g.u,v:g.v,seatedOn:seat?.id,pose:{...p,facing:p.facing==='left'?-1:1,phase:p.walking&&!p.resting?performance.now()/100:0},nickname:p.nickname};})].sort((a,b)=>a.pose.y-b.pose.y);
            const ordered=cipherDrawOrder(this.editor.items,null,cipherFurnitureSize);
            for(const actor of actors){const index=ordered.findIndex(item=>item.asset!=='player'&&cipherDepthCompare(actor,item,cipherFurnitureSize)<=0),seatIndex=actor.seatedOn?ordered.findIndex(item=>item.id===actor.seatedOn):-1;ordered.splice(Math.max(index<0?ordered.length:index,seatIndex+1),0,actor);}
            for(const item of ordered)if(item.asset==='player')this.paintPlayer(ctx,item.pose,item.nickname);else this.editor.paint(ctx,[item]);
            this.paintDialogueHighlight(ctx);return;
        }
        if(!this.showGrid&&!this.editor.active){
            const ordered=cipherDrawOrder(this.editor.items,this.playerItem(),cipherFurnitureSize),split=ordered.findIndex(item=>item.asset==='player');
            const key=JSON.stringify(ordered.filter(item=>item.asset!=='player'))+':'+split;
            if(!this.sceneLayers||this.sceneLayers.key!==key){
                const layoutKey=JSON.stringify(this.editor.items)+JSON.stringify(Object.values(this.editor.images).map(image=>image.naturalWidth));
                if(this.sceneLayerLayout!==layoutKey){this.sceneLayerCache=new Map();this.sceneLayerLayout=layoutKey;}
                this.sceneLayerCache??=new Map();
                const makeLayer=items=>{const layer=document.createElement('canvas');layer.width=this.canvas.width;layer.height=this.canvas.height;this.editor.paint(layer.getContext('2d'),items);return layer;};
                this.sceneLayers=this.sceneLayerCache.get(key);
                if(!this.sceneLayers){this.sceneLayers={key,back:makeLayer(ordered.slice(0,split)),front:makeLayer(ordered.slice(split+1))};this.sceneLayerCache.set(key,this.sceneLayers);}
            }
            ctx.drawImage(this.sceneLayers.back,0,0);this.paintPlayer(ctx);ctx.drawImage(this.sceneLayers.front,0,0);this.paintDialogueHighlight(ctx);return;
        }
        this.sceneLayers=null;
        if(!this.showGrid){this.editor?.paint(ctx);this.paintDialogueHighlight(ctx);return;}
        // The overlay and furniture placement share the measured tile boundaries.
        ctx.save();ctx.beginPath();
        CIPHER_FLOOR.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));
        ctx.closePath();ctx.clip();
        ctx.strokeStyle='#ff4488';ctx.lineWidth=1;
        for(const lines of CIPHER_GRID_LINES)for(const {m,b} of lines){
            ctx.beginPath();ctx.moveTo(m*350+b,350);ctx.lineTo(m*1037.6+b,1037.6);ctx.stroke();
        }
        ctx.restore();
        this.editor?.paint(ctx);this.paintDialogueHighlight(ctx);
    }
    paintDialogueHighlight(ctx){
        if(!Number.isInteger(this.dialoguePage)||this.notice.hidden)return;
        const target=AGENT_K_HIGHLIGHTS[this.dialoguePage];
        if(!target)return;
        let paths;
        // Follow each object's visible face instead of covering it with a bounding box.
        if(target==='leftDoor')paths=[[[129,462],[198,421],[198,618],[129,661]].map(p=>cipherWallPoint(...p))];
        else if(target==='rightDoor')paths=[[[1250,440],[1321,480],[1321,659],[1250,620]].map(p=>cipherWallPoint(...p))];
        else if(target==='stairs')paths=[[[940,276],[1017,319],[1017,500],[940,457]].map(p=>cipherWallPoint(...p))];
        else if(target==='display'){
            const item=this.editor.items.find(i=>i.asset==='cornerDisplay');if(!item)return;
            const r=cipherRasterRect(item),spec=CIPHER_FURNITURE_RASTERS.cornerDisplay;
            paths=[[[122,450],[697,145],[697,628],[122,924]],[[749,145],[1324,450],[1324,924],[749,628]]].map(points=>points.map(([x,y])=>[r.x+x*r.w/spec.size[0],r.y+y*r.h/spec.size[1]]));
        }
        else if(target==='carpet'){
            const i=this.editor.items.find(i=>i.asset==='carpet');if(!i)return;
            const [w,h]=cipherFurnitureSize(i);paths=[[[i.u,i.v],[i.u+w,i.v],[i.u+w,i.v+h],[i.u,i.v+h]].map(([u,v])=>{const p=cipherGridToScreen(u,v);return [p.x,p.y];})];
        }
        if(!paths)return;
        // Cyan outline and a soft outer halo, matching the door reference.
        const pulse=(1-Math.cos(performance.now()*Math.PI/1200))/2;
        ctx.save();ctx.lineJoin='round';
        for(const points of paths){
            ctx.beginPath();points.forEach((p,n)=>n?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
            ctx.strokeStyle='rgba(0,230,207,.22)';ctx.lineWidth=7;
            ctx.shadowColor='rgba(0,230,207,.8)';ctx.shadowBlur=25+7*pulse;ctx.stroke();
            ctx.shadowBlur=9;ctx.strokeStyle='#00e6cf';ctx.lineWidth=3;ctx.stroke();
        }
        ctx.restore();
    }
    ensurePlayer(){if(!this.navigation.isWalkable(this.player.x,this.player.y))Object.assign(this.player,this.navigation.clamp(this.player.x,this.player.y));}
    nearExit(){return this.editor.items.some(i=>i.asset==='carpet')&&this.player.nearby()?.action==='exit';}
    beginStairs(){
        this.player.stop();this.stairAttempt=false;
        this.stairMotion=null;this.showMembershipNotice();
    }
    descendStairs(){
        if(!this.stairMotion)return;
        this.stairMotion={points:[{x:984,y:481},{x:975,y:499},{x:966,y:517},{...CIPHER_STAIR_LANDING}],step:0,descending:true};
    }
    updateStairs(dt){
        const motion=this.stairMotion,target=motion.points[motion.step];
        const dx=target.x-this.player.x,dy=target.y-this.player.y,length=Math.hypot(dx,dy),distance=Math.min(length,165*dt);
        if(length){this.player.x+=dx/length*distance;this.player.y+=dy/length*distance;this.player.facing=dx<0?-1:1;this.player.phase+=dt*9.5;}
        if(length<=distance+.01){Object.assign(this.player,target);motion.step++;if(motion.step===motion.points.length){if(motion.descending){this.stairMotion=null;this.player.stop();}else this.showMembershipNotice();}}
    }
    nearAgentK(){
        const desk=this.editor.items.find(i=>i.asset==='counter');if(!desk)return false;
        const p=desk.rotation===1?cipherGridToScreen(desk.u+1.5,desk.v+2.35):cipherGridToScreen(desk.u+2.35,desk.v+1.5);
        return Math.hypot(this.player.x-p.x,this.player.y-p.y)<90;
    }
    talkToAgentK(){
        if(!this.nearAgentK()||this.editor.active)return;
        this.player.stop();
        let introduced=this.agentKIntroduced;
        try{introduced||=localStorage.getItem('stockwars.cipher.agent-k.introduced')==='1';}catch{}
        if(introduced)this.renderAgentChoices();
        else{
            this.agentKIntroduced=true;
            try{localStorage.setItem('stockwars.cipher.agent-k.introduced','1');}catch{}
            this.startAgentIntroduction();
        }
        this.notice.hidden=false;this.notice.querySelector('button').focus();
    }
    startAgentIntroduction(){
        this.restoreNotice();this.dialoguePage=0;this.renderAgentDialogue();
    }
    renderAgentChoices(){
        this.startAgentIntroduction();this.dialoguePage=null;this.agentChoiceMode=true;
        this.notice.querySelector('.cipher-dialogue-text').textContent='다시 찾아주셨군요. 무엇을 도와드릴까요?';
        this.notice.querySelector('.cipher-dialogue-progress').parentElement.hidden=true;
        this.notice.querySelector('[data-dialogue=next]').hidden=true;
        const skip=this.notice.querySelector('[data-dialogue=skip]');skip.textContent='대화 마치기';
        const choices=document.createElement('div');choices.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-top:14px';
        for(const [label,action] of [
            ['옵시디언 회원 가입',()=>this.renderAgentMembership()],
            ['공간 소개',()=>this.startAgentIntroduction()]
        ]){
            const button=document.createElement('button');button.textContent=label;
            button.style.cssText='padding:10px 18px;border:1px solid #c69a27;border-radius:8px;background:#493409;color:#ffd35f;font-size:14px;font-weight:700;cursor:pointer';
            button.onclick=action;choices.append(button);
        }
        this.notice.querySelector('.cipher-dialogue-body').append(choices);
    }
    renderAgentMembership(){
        this.renderAgentChoices();
        this.notice.querySelector('.cipher-dialogue-text').textContent='옵시디언 회원 가입 절차는 현재 준비 중입니다. 가입 조건과 혜택이 정해지면 이곳에서 안내해 드리겠습니다.';
        const choices=this.notice.querySelector('.cipher-dialogue-body').lastElementChild;
        choices.replaceChildren();
        const back=document.createElement('button');back.textContent='선택지로 돌아가기';
        back.style.cssText='padding:10px 18px;border:1px solid #c69a27;border-radius:8px;background:#493409;color:#ffd35f;cursor:pointer';
        back.onclick=()=>this.renderAgentChoices();choices.append(back);
    }
    renderAgentDialogue(){
        this.notice.onclick=e=>{
            if(e.target.closest('button')||!Number.isInteger(this.dialoguePage))return;
            this.advanceNotice();
        };
        if(!this.notice.querySelector('.cipher-dialogue-text')){
            this.notice.style.cssText='position:absolute;left:20px;right:20px;bottom:20px;top:auto;padding:16px 20px;background:rgba(12,13,17,.97);color:#fff2d9;border:2px solid #dcae39;border-radius:16px;z-index:10;box-shadow:0 10px 35px #0008;display:flex;gap:18px;align-items:center;text-align:left';
            this.notice.innerHTML=`<img class="cipher-agent-portrait" src="${agentKPortraitUrl}" alt="에이전트 K"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px"><strong style="color:#f3cf70;border:1px solid #3a8190;border-radius:20px;padding:6px 12px;background:#102b35">● 에이전트 K <small style="margin-left:8px;color:#c4b575">Cipher Securities</small></strong><div style="display:flex;gap:6px"><button data-dialogue="collapse" aria-label="대화창 접기" style="padding:5px 10px;border:1px solid #665740;border-radius:6px;background:#25222a;color:#f1d995">−</button><button data-dialogue="skip" style="padding:5px 10px;border:1px solid #665740;border-radius:6px;background:#25222a;color:#c4b9a4">⏩ 스킵</button><button data-dialogue="next" style="padding:5px 12px;border:1px solid #c69a27;border-radius:6px;background:#493409;color:#ffd35f;font-weight:700">다음 ▶</button></div></div><div class="cipher-dialogue-body"><p class="cipher-dialogue-text" style="margin:0;line-height:1.7;font-size:15px;font-weight:600"></p><div style="display:flex;justify-content:space-between;color:#e5ba42;font-size:12px;margin-top:12px"><span class="cipher-dialogue-progress"></span><span>▼</span></div></div></div>`;
            this.notice.querySelector('[data-dialogue=next]').onclick=()=>this.advanceNotice();
            this.notice.querySelector('[data-dialogue=skip]').onclick=()=>this.advanceNotice(true);
            this.notice.querySelector('[data-dialogue=collapse]').onclick=e=>{const body=this.notice.querySelector('.cipher-dialogue-body');body.hidden=!body.hidden;e.target.textContent=body.hidden?'+':'−';};
        }
        this.notice.querySelector('.cipher-dialogue-text').textContent=AGENT_K_WELCOME[this.dialoguePage];
        this.notice.querySelector('.cipher-dialogue-progress').textContent='';
        this.notice.querySelector('[data-dialogue=next]').textContent=this.dialoguePage===AGENT_K_WELCOME.length-1?'대화 마치기':'다음 ▶';
    }
    restoreNotice(){
        this.agentChoiceMode=false;
        this.notice.onclick=null;
        this.notice.innerHTML=this.defaultNoticeHTML;this.notice.style.cssText=this.defaultNoticeStyle;
        this.noticeHeading=this.notice.querySelector('strong');this.noticeHeading.hidden=true;
        this.notice.querySelector('button').onclick=()=>this.advanceNotice();
    }
    advanceNotice(cancel=false){
        if(this.agentChoiceMode&&!cancel)return;
        if(!cancel&&Number.isInteger(this.dialoguePage)&&this.dialoguePage<AGENT_K_WELCOME.length-1){this.dialoguePage++;this.renderAgentDialogue();return;}
        this.dialoguePage=null;this.restoreNotice();this.notice.hidden=true;this.descendStairs();this.canvas.focus();
    }
    nearStairs(){return Math.hypot(this.player.x-CIPHER_STAIR_LANDING.x,this.player.y-CIPHER_STAIR_LANDING.y)<65;}
    showMembershipNotice(){this.restoreNotice();this.dialoguePage=null;this.noticeHeading.hidden=true;this.notice.querySelector('button').textContent='확인';this.notice.querySelector('p').textContent='회원이 아닙니다. 2층은 회원 전용 공간입니다.';this.player.stop();this.stairAttempt=false;this.stairNotified=true;this.notice.hidden=false;this.notice.querySelector('button').focus();}
    movePlayerTo(p){if(!this.notice.hidden)return;this.standUp();this.stairAttempt=p.x>=927&&p.x<=1105&&p.y>=210&&p.y<=558;const target=this.stairAttempt?CIPHER_STAIR_LANDING:p;this.player.moveTo(target.x,target.y);this.canvas.focus();}
    paintPlayer(ctx,pose=this.player,nickname=''){
        const p=pose,seated=pose===this.player?this.seated:pose.resting;
        ctx.save();ctx.translate(p.x,p.y-(seated?24:0));
        ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(0,0,24,7,0,0,Math.PI*2);ctx.fill();
        ctx.translate(0,seated?0:-Math.sin(p.phase)*5);ctx.scale(p.facing,1);
        ctx.shadowColor='#00000066';ctx.shadowBlur=10;ctx.shadowOffsetY=5;
        ctx.fillStyle='#ffffff';ctx.strokeStyle='#2c3e50';ctx.lineWidth=3;
        ctx.beginPath();ctx.roundRect(-28,-58,56,56,10);ctx.fill();ctx.stroke();
        ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
        ctx.fillStyle='#1e272e';
        for(const x of [-10,6]){ctx.beginPath();ctx.roundRect(x,-40,6,10,3);ctx.fill();}
        ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7,-25);ctx.bezierCurveTo(-7,-15,8,-15,8,-25);ctx.stroke();
        ctx.fillStyle='#00d8ee';ctx.beginPath();ctx.arc(17,-12,4.5,0,Math.PI*2);ctx.fill();
        ctx.restore();
        if(nickname){ctx.save();ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillStyle='#071e2d';const width=ctx.measureText(nickname).width+18;ctx.fillRect(p.x-width/2,p.y-85,width,22);ctx.fillStyle='#6eeaff';ctx.fillText(nickname,p.x,p.y-68);ctx.restore();}
    }
    playerItem(){const g=cipherScreenToGrid(this.player.x,this.player.y);return {asset:'player',u:g.u,v:g.v,seatedOn:this.seated?.id};}
    nearbySeat(){
        let best=null;
        for(const sofa of this.editor.items.filter(i=>i.asset==='sofa'))for(const offset of [.5,1.5]){
            const u=sofa.u+(sofa.rotation===1?offset:.68),v=sofa.v+(sofa.rotation===1?.68:offset);
            const p=cipherGridToScreen(u,v),approach=cipherGridToScreen(u+(sofa.rotation===1?0:.8),v+(sofa.rotation===1?.8:0));
            const distance=Math.hypot(this.player.x-approach.x,this.player.y-approach.y);
            if(distance<80&&(!best||distance<best.distance))best={id:sofa.id,...p,distance};
        }
        return best;
    }
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
    enterTrainingRoom(){const door=this.nearbyRoomDoor();if(!door)return;this.player.stop();cancelAnimationFrame(this.frame);if(door.label==='트레이닝룸 이동')this.trainingRoom.open();else this.competitionRoom.open();}
    nearbyRoomDoor(){
        const doors=[{...cipherGridToScreen(.6,8.5),label:'트레이닝룸 이동'},{...cipherGridToScreen(8.5,.6),label:'모의투자 경쟁룸 이동'}];
        return doors.find(p=>Math.hypot(this.player.x-p.x,this.player.y-p.y)<105);
    }
    updateExitPrompt(){
        const seatAvailable=this.isOpen&&!this.editor.active&&this.notice.hidden&&!this.stairMotion&&(this.seated||this.nearbySeat());
        this.sitPrompt.hidden=!seatAvailable;const seatText=this.seated?'일어나기 · F':'앉기 · F';if(this.sitPrompt.textContent!==seatText)this.sitPrompt.textContent=seatText;
        const visible=this.isOpen&&!this.editor.active&&this.notice.hidden&&!this.stairMotion&&this.nearExit();
        this.exitPrompt.hidden=!visible;
        const stairs=this.isOpen&&!this.editor.active&&this.notice.hidden&&!this.stairMotion&&this.nearStairs();this.stairPrompt.hidden=!stairs;const talk=this.isOpen&&!this.editor.active&&this.notice.hidden&&!this.stairMotion&&this.nearAgentK();this.talkPrompt.hidden=!talk;if(talk)this.stairPrompt.hidden=true;const door=this.isOpen&&!this.editor.active&&this.notice.hidden&&!this.stairMotion?this.nearbyRoomDoor():null;this.doorPrompt.hidden=!door;if(door&&this.doorPrompt.textContent!==door.label+' · F')this.doorPrompt.textContent=door.label+' · F';if(!visible&&!stairs&&!talk&&!door&&!seatAvailable)return;
        const canvas=this.canvas.getBoundingClientRect(),dialog=this.dialog.getBoundingClientRect(),uiScale=elementScale(this.dialog);
        const scale=Math.min(canvas.width/this.canvas.width,canvas.height/this.canvas.height);
        const prompt=seatAvailable?this.sitPrompt:talk?this.talkPrompt:stairs?this.stairPrompt:visible?this.exitPrompt:this.doorPrompt;prompt.style.left=`${(canvas.left-dialog.left+(canvas.width-this.canvas.width*scale)/2+this.player.x*scale)/uiScale}px`;
        prompt.style.top=`${(canvas.top-dialog.top+(canvas.height-this.canvas.height*scale)/2+(this.player.y-78)*scale)/uiScale}px`;
    }
    animate(now){if(!this.isOpen)return;if(!this.editor.active&&this.notice.hidden&&this.stairMotion){this.updateStairs(Math.min((now-this.lastFrame)/1000,.05));}else if(!this.editor.active&&this.notice.hidden){if(!this.seated){this.navigation.beginFrame();this.ensurePlayer();this.player.update((now-this.lastFrame)/1000);this.navigation.endFrame();}const d=Math.hypot(this.player.x-CIPHER_STAIR_LANDING.x,this.player.y-CIPHER_STAIR_LANDING.y);if(d>85)this.stairNotified=false;if(this.stairAttempt&&d<8)this.beginStairs();}else this.player.stop();this.lastFrame=now;const g=cipherScreenToGrid(this.player.x,this.player.y);this.canvas.dataset.playerU=g.u.toFixed(3);this.canvas.dataset.playerV=g.v.toFixed(3);const hintText=this.editor.active?'':this.seated?'F · 일어나기':this.nearbySeat()?'F · 앉기':this.nearAgentK()?'F · 에이전트 K와 대화하기':this.nearStairs()?'F · 엘리베이터 이용':this.nearExit()?'F · 마을로 나가기':'WASD · 바닥 클릭 이동 · Shift 달리기';if(this.hint.textContent!==hintText)this.hint.textContent=hintText;this.updateExitPrompt();this.draw();this.frame=requestAnimationFrame(t=>this.animate(t));}
    open(){if(this.isOpen)return;this.dialog.showModal();this.isOpen=true;this.restoreNotice();this.dialoguePage=null;this.notice.hidden=true;this.stairMotion=null;this.stairNotified=false;this.stairAttempt=false;this.seated=null;this.player.reset();this.ensurePlayer();this.lastFrame=performance.now();this.canvas.focus();this.animate(this.lastFrame);}
    close(){if(this.editor.active)this.editor.cancel();this.dialog.close();this.isOpen=false;}
}















