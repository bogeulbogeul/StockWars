export class OnlineSocialSync {
    constructor(app){this.app=app;this.remotes=new Map();this.start();}
    start(){this.poll();this.socialTimer=setInterval(()=>void this.checkInvites(),2500);this.animate();}
    currentScene(){
        const a=this.app,c=a.cipherLobby;
        if(c.competitionRoom.dialog.open)return {location:'arena',player:c.player};
        if(c.trainingRoom.dialog.open)return {location:'training',player:c.player};
        if(c.isOpen)return {location:'cipher',player:c.player};
        if(a.vivianStoreModal.isOpen)return {location:'vivian',player:a.vivianStoreModal.player};
        if(a.logisticsMiniGame.isOpen)return {location:'logistics',player:{x:0,y:0}};
        if(document.body.classList.contains('town-mode-active'))return {location:'town',player:a.townStage.playerController};
        return null;
    }
    async poll(){
        const scene=this.currentScene(),a=this.app;
        if(scene&&a.userProfile?.nickname&&window.stockWarsPresence?.position){
            try{
                const p=scene.player;
                const seat=scene.location==='cipher'?a.cipherLobby.seated:p.restingBench;
                const sofa=scene.location==='cipher'&&seat?a.cipherLobby.editor.items.find(i=>i.id===seat.id):null;
                const seatId=sofa?`sofa:${sofa.u}:${sofa.v}:${sofa.rotation||0}`:seat?.id;
                const result=await window.stockWarsPresence.position({location:scene.location,x:p.charPosX??p.x,y:p.charPosY??p.y,facing:typeof p.facing==='string'?p.facing:p.facing===-1?'left':'right',resting:!!seat||p.isResting||false,seatId,nickname:a.userProfile.nickname,level:a.itemEngine?.playerLevel()||1,trait:a.userProfile.trait?.title||''});
                if(!result.error&&this.currentScene()?.location===scene.location)this.receive(result.snapshot?.players||[],scene.location);
            }catch{}
        }else this.receive([],null);
        this.positionTimer=setTimeout(()=>this.poll(),100);
    }
    receive(players,location){
        this.app.townStage.setRemotePlayers(location==='town'?players:[]);
        const seen=new Set(),now=performance.now();
        for(const p of players.filter(p=>p.location===location&&['cipher','vivian'].includes(location))){
            seen.add(p.id);let entry=this.remotes.get(p.id);
            if(!entry||entry.location!==location){entry?.element?.remove();entry={x:p.x,y:p.y};this.remotes.set(p.id,entry);}
            if(entry.resting!==p.resting){entry.x=p.x;entry.y=p.y;}
            if(!entry.received||entry.poseAt!==p.poseAt||entry.targetX!==p.x||entry.targetY!==p.y){Object.assign(entry,{fromX:entry.x,fromY:entry.y,targetX:p.x,targetY:p.y,received:now,duration:Math.min(1000,Math.max(200,now-(entry.received||now-300)))});}
            Object.assign(entry,{...p,x:entry.x,y:entry.y});
        }
        for(const [id,p] of this.remotes)if(!seen.has(id)){p.element?.remove();this.remotes.delete(id);}
    }
    animate(){
        const now=performance.now(),scene=this.currentScene();
        for(const p of this.remotes.values()){
            const t=Math.min(1,(now-p.received)/(p.duration||300));p.x=p.fromX+(p.targetX-p.fromX)*t;p.y=p.fromY+(p.targetY-p.fromY)*t;p.walking=t<1&&Math.hypot(p.targetX-p.fromX,p.targetY-p.fromY)>1;
            if(p.location==='vivian'){
                if(!p.element){p.element=this.app.vivianStoreModal.playerEl.cloneNode(true);p.element.removeAttribute('id');p.element.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));p.element.style.pointerEvents='none';const tag=document.createElement('span');tag.className='town-char-nametag';p.element.append(tag);this.app.vivianStoreModal.interiorEl.append(p.element);}
                p.element.style.left=`${p.x/1536*100}%`;p.element.style.top=`${p.y/1024*100}%`;p.element.style.display=scene?.location==='vivian'?'':'none';p.element.querySelector('.town-char-nametag').textContent=p.nickname;p.element.querySelector('.town-char-body').style.transform=`scaleX(${p.facing==='left'?-1:1}) translateY(${p.walking?-Math.abs(Math.sin(now/100))*4:0}px)`;
            }
        }
        this.app.cipherLobby.remotePlayers=scene?.location==='cipher'?[...this.remotes.values()].filter(p=>p.location==='cipher'):[];
        this.frame=requestAnimationFrame(()=>this.animate());
    }
    async checkInvites(){
        if(this.checking||!this.app.userProfile?.nickname||!window.stockWarsArena)return;
        this.checking=true;
        try{
            const result=await window.stockWarsArena.request({action:'list'});if(result.error)return;
            const a=this.app,c=a.cipherLobby.competitionRoom;
            if(this.inviteDialog&&!result.invitations?.some(r=>r.id===this.inviteId)){this.inviteDialog.close();this.inviteDialog.remove();this.inviteDialog=null;}
            if(this.inviteDialog||a.annaTutorial?.isActive||a.cipherLobby.notice&&!a.cipherLobby.notice.hidden||document.body.classList.contains('phone-view-active')||c.onlineState||c.dialog.open||a.cipherLobby.trainingRoom.dialog.open||document.querySelector('dialog[open]:not(.cipher-lobby)')||!document.querySelector('#titleScreen')?.classList.contains('hidden'))return;
            const room=result.invitations?.[0];if(!room)return;
            const popup=document.createElement('dialog');popup.className='settings-dialog';popup.setAttribute('aria-label','모의투자 초대');const title=document.createElement('h2');title.textContent='모의투자 초대';const text=document.createElement('p');text.textContent=`${room.host}님이 ${room.name} 대결에 초대했습니다. (${room.minutes}분)`;
            const status=document.createElement('p'),accept=document.createElement('button'),cancel=document.createElement('button');accept.textContent='확인';cancel.textContent='취소';
            const dismiss=()=>{popup.close();popup.remove();this.inviteDialog=null;};
            const decline=async()=>{const response=await window.stockWarsArena.request({action:'decline',id:room.id});if(response.error){status.textContent=response.error;return;}dismiss();};
            cancel.onclick=()=>void decline();popup.addEventListener('cancel',e=>{e.preventDefault();void decline();});
            accept.onclick=async()=>{accept.disabled=true;try{const state=await c.arenaRequest({action:'join',id:room.id});dismiss();a.cipherLobby.player.stop();if(a.cipherLobby.isOpen)cancelAnimationFrame(a.cipherLobby.frame);c.open();c.enterOnline(state);}catch(e){status.textContent=e.message;accept.disabled=false;}};
            popup.append(title,text,status,accept,cancel);(a.cipherLobby.isOpen?a.cipherLobby.dialog:a.appContainer).append(popup);this.inviteDialog=popup;this.inviteId=room.id;popup.showModal();
        }catch{}finally{this.checking=false;}
    }
}
