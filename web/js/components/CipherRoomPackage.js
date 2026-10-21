import {ROOM_SIZE,OBJECTS,PLACES,SEATS,inside,createPackageNavigation} from './CipherRoomPackageGeometry.js';
import {marketEngine} from '../engine/marketEngine.js';
import { EMPTY_CHARACTER_IMAGE } from '../data/characterAsset.js';
import {elementScale} from '../app/GameViewport.js';
import {cipherCanvasResolution} from './CipherCanvasResolution.js';

// Source-art coordinates remain the package's navigation/interaction map.
// Gameplay/actor proportion only; independent of canvas pixel resolution.
export const CIPHER_ROOM_SCALE = 0.6;
export const CIPHER_AGENT_ENABLED = true;

export class CipherRoomPackage {
    constructor(lobby){
        this.lobby=lobby;this.navigation=createPackageNavigation();this.pending=null;
        this.scale=CIPHER_ROOM_SCALE;
        lobby.canvas.width=ROOM_SIZE.width;lobby.canvas.height=ROOM_SIZE.height;
        this.background=new Image();this.background.onload=()=>lobby.draw();
        this.background.onerror=()=>{lobby.dialog.querySelector('.cipher-lobby-error').hidden=false;};
        // Retired 2D package: retain compatibility state without loading old artwork.
        this.background.src=EMPTY_CHARACTER_IMAGE;
        this.overlay=document.createElement('div');this.overlay.className='cipher-package-overlay';
        this.overlay.innerHTML='<section class="cipher-index-board" aria-label="사이퍼 지수 전광판"><header><strong>사이퍼 지수</strong><span>게임 시장</span></header><div class="cipher-index-data"><div><small>CIPHER INDEX</small><b class="cipher-index-value">—</b><span class="cipher-index-change"></span></div><div class="cipher-index-plot" role="img" aria-label="사이퍼 지수 추이"></div></div><footer>로비 입장 이후 지수 추이 · pt</footer></section>';
        lobby.canvas.after(this.overlay);
        this.board=this.overlay.querySelector('section');this.plot=this.overlay.querySelector('.cipher-index-plot');
        this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(lobby.canvas);
        lobby.canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();const r=lobby.canvas.getBoundingClientRect(),s=Math.min(r.width/ROOM_SIZE.width,r.height/ROOM_SIZE.height);lobby.movePlayerTo({x:(event.clientX-r.left-(r.width-ROOM_SIZE.width*s)/2)/s,y:(event.clientY-r.top-(r.height-ROOM_SIZE.height*s)/2)/s});});
        // Keyboard equivalents use the same approach/move/arrival flow as object clicks.
        const actions=document.createElement('nav');actions.className='cipher-package-actions';actions.setAttribute('aria-label','로비 시설로 이동');
        for(const place of [...PLACES.filter(p=>CIPHER_AGENT_ENABLED||p.id!=='agent'),...SEATS.map(s=>({...s,label:'소파 앉기'}))]){const button=document.createElement('button');button.textContent=place.label;button.onclick=()=>this.request(place.id);actions.append(button);}
        lobby.dialog.append(actions);
    }
    syncResolution(){
        const size=this.displaySize;
        if(!size)return false;
        const pixels=cipherCanvasResolution(size.width,size.height,globalThis.devicePixelRatio,ROOM_SIZE);
        if(!pixels)return false;
        const canvas=this.lobby.canvas;
        if(canvas.width===pixels.width&&canvas.height===pixels.height)return false;
        canvas.width=pixels.width;canvas.height=pixels.height;
        return true;
    }
    resize(){
        const {canvas,dialog}=this.lobby,r=canvas.getBoundingClientRect(),d=dialog.getBoundingClientRect(),ui=elementScale(dialog),s=Math.min(r.width/ROOM_SIZE.width,r.height/ROOM_SIZE.height);
        if(!(r.width>0&&r.height>0))return;
        this.displaySize={width:r.width,height:r.height};
        this.syncResolution();
        this.overlay.style.left=`${(r.left-d.left+(r.width-ROOM_SIZE.width*s)/2)/ui}px`;
        this.overlay.style.top=`${(r.top-d.top+(r.height-ROOM_SIZE.height*s)/2)/ui}px`;
        this.overlay.style.transform=`scale(${s/ui})`;
        this.lobby.draw();
    }
    open(){this.pending=null;this.history=[];this.day=null;this.unsubscribe?.();this.updateIndex(marketEngine.getState());this.unsubscribe=marketEngine.subscribe(state=>this.updateIndex(state));this.resize();}
    close(){this.pending=null;this.unsubscribe?.();this.unsubscribe=null;}
    updateIndex(state){
        const value=Number(state.cipherIndex?.val),pct=Number(state.cipherIndex?.diffPct);
        if(!Number.isFinite(value)||!Number.isFinite(pct)){this.board.querySelector('.cipher-index-value').textContent='미연결';this.plot.replaceChildren();return;}
        if(this.day!==state.day){this.history=[];this.day=state.day;}
        if(this.history.at(-1)!==value)this.history.push(value);this.history=this.history.slice(-60);
        this.board.querySelector('.cipher-index-value').textContent=value.toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2});
        const change=this.board.querySelector('.cipher-index-change');change.textContent=`${pct>=0?'▲':'▼'} ${Math.abs(pct).toFixed(2)}%`;change.style.color=pct>=0?'#66e0b4':'#ff939d';
        this.plot.replaceChildren();const values=this.history,lo=Math.min(...values)-1,hi=Math.max(...values)+1,width=390,height=72;
        const points=values.map((v,i)=>({x:values.length===1?width:i/(values.length-1)*width,y:height-(v-lo)/(hi-lo)*height}));
        points.forEach((p,i)=>{if(!i)return;const a=points[i-1],line=document.createElement('i');line.style.cssText=`left:${a.x}px;top:${a.y}px;width:${Math.hypot(p.x-a.x,p.y-a.y)}px;transform:rotate(${Math.atan2(p.y-a.y,p.x-a.x)}rad)`;this.plot.append(line);});
        const dot=document.createElement('em'),last=points.at(-1);dot.style.left=`${last.x}px`;dot.style.top=`${last.y}px`;this.plot.append(dot);
        this.plot.setAttribute('aria-label',`사이퍼 지수 ${value.toFixed(2)} pt, ${values.length}개 관측값`);
        this.board.querySelector('footer').textContent=values.length<2?'지수 수신 중 · 다음 변동부터 추이 표시':'로비 입장 이후 지수 추이 · pt';
    }
    near(id,radius=62){const p=PLACES.find(p=>p.id===id);return !!p&&Math.hypot(this.lobby.player.x-p.x,this.lobby.player.y-p.y)<radius;}
    occupied(seat){return this.lobby.remotePlayers?.some(p=>p.resting&&(p.seatId===seat.id||p.seatId?.startsWith(seat.id+'-')))||false;}
    nearbySeat(){const l=this.lobby;return SEATS.filter(s=>!this.occupied(s)).map(s=>({...s,distance:Math.hypot(l.player.x-s.approach.x,l.player.y-s.approach.y)})).filter(s=>s.distance<48).sort((a,b)=>a.distance-b.distance)[0]||null;}
    request(id){
        if(id==='agent'&&!CIPHER_AGENT_ENABLED)return;
        const l=this.lobby;if(!l.isOpen||!l.notice.hidden||l.tour?.active||l.trainingRoom.dialog.open||l.competitionRoom.dialog.open)return;
        l.standUp();l.player.stop();const place=PLACES.find(p=>p.id===id)||SEATS.find(s=>s.id===id);if(!place)return;
        if(place.sofa&&this.occupied(place)){this.pending=null;return;}
        const target=place.approach||place;if(!this.navigation.route(l.player,target).length){l.hint.textContent='이곳으로 이동할 수 없습니다.';return;}
        this.pending=id;l.player.moveTo(target.x,target.y);l.canvas.focus();
    }
    moveTo(p){
        const l=this.lobby;if(!l.notice.hidden||l.tour?.active)return;
        const place=PLACES.find(q=>(CIPHER_AGENT_ENABLED||q.id!=='agent')&&inside(p.x,p.y,q.hit));
        const sofa=OBJECTS.find(o=>o.id.startsWith('sofa')&&inside(p.x,p.y,o.silhouette));
        if(place)return this.request(place.id);
        if(sofa){const seat=SEATS.find(s=>s.sofa===sofa.id&&!this.occupied(s));if(seat)return this.request(seat.id);return;}
        this.pending=null;l.standUp();l.player.moveTo(p.x,p.y);l.canvas.focus();
    }
    update(){
        const l=this.lobby;if(['w','a','s','d'].some(k=>l.player.keys.has(k)))this.pending=null;
        if(!this.pending||!l.notice.hidden||l.tour?.active)return;
        const id=this.pending,seat=SEATS.find(s=>s.id===id),place=seat?.approach||PLACES.find(p=>p.id===id);
        if(Math.hypot(l.player.x-place.x,l.player.y-place.y)>5)return;
        this.pending=null;l.player.stop();
        if(seat){if(this.occupied(seat))return;l.toggleSitting();}
        else if(id==='exit')l.close();else if(id==='agent')l.talkToAgentK();else if(id==='elevator')l.showMembershipNotice();else l.enterTrainingRoom();
    }
    path(ctx,points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
    actorPose(pose,seat){
        // Old online coordinates also pass through the same safe standing map.
        // Only a recognised occupied seat is allowed inside a sofa.
        return {...pose,...(seat?{x:seat.x,y:seat.y,phase:0,resting:true,facing:seat.id==='lounge-left'?1:-1}:this.navigation.clamp(pose.x,pose.y))};
    }
    draw(ctx){
        if(!this.background.naturalWidth)return;
        ctx.drawImage(this.background,0,0,ROOM_SIZE.width,ROOM_SIZE.height);
        const l=this.lobby,actors=[{pose:l.player,seat:l.seated},...(l.remotePlayers||[]).map(p=>({pose:{...p,facing:p.facing==='left'?-1:1,phase:p.walking&&!p.resting?performance.now()/100:0},seat:p.resting?SEATS.find(s=>s.id===p.seatId):null,nickname:p.nickname}))];
        for(const actor of actors)actor.pose=this.actorPose(actor.pose,actor.seat);
        actors.sort((a,b)=>a.pose.y-b.pose.y);
        for(const actor of actors)l.paintPlayer(ctx,actor.pose,actor.nickname);
        const target=[null,'display','training','competition','elevator','exit'][l.dialoguePage];
        if(target&&(!l.notice.hidden||l.tour?.active)){const shape=target==='display'?[[406,307],[733,151],[733,297],[406,449]]:PLACES.find(p=>p.id===target)?.hit;if(shape){ctx.save();this.path(ctx,shape);ctx.strokeStyle='#66ffe3';ctx.lineWidth=4;ctx.shadowColor='#66ffe3';ctx.shadowBlur=15;ctx.stroke();ctx.restore();}}
    }
}
