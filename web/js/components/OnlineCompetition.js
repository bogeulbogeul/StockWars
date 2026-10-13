import { MarketEngine } from '../engine/marketEngine.js';
import { CipherTrainingRoom } from './CipherTrainingRoom.js';
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');
const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await action();}catch(e){b.title=e.message;const status=b.closest('dialog')?.querySelector('[data-status],.training-result');if(status)status.textContent=e.message;}finally{if(!b.dataset.locked)b.disabled=false;}};return b;};
export function installOnlineCompetition(Competition) {
    const originalRender=Competition.prototype.render,originalJoin=Competition.prototype.requestJoin;
    Object.assign(Competition.prototype,{
        async arenaRequest(input) {
            if(!window.stockWarsArena?.request)throw new Error('온라인 대결은 서버에 연결된 데스크톱 앱에서 이용할 수 있습니다. AI 모드는 계속 이용할 수 있습니다.');
            const result=await window.stockWarsArena.request(input);if(result.error)throw Object.assign(new Error(result.error),{retryable:result.retryable});return result;
        },
        open(){this.dialog.showModal();this.render();void this.refreshPublicRooms();this.publicTimer=setInterval(()=>this.refreshPublicRooms(),2000);},
        close(){clearInterval(this.publicTimer);if(this.onlineState?.room)this.arenaRequest({action:'leave',id:this.onlineState.room.id}).catch(()=>{});this.onlineState=null;this.dialog.close();this.onClose?.();},
        render(){
            originalRender.call(this);
            const form=this.dialog.querySelector('[data-create]'),submit=form.onsubmit;
            const label=document.createElement('label');label.textContent='대결 방식';const mode=document.createElement('select');mode.name='mode';
            for(const [value,text] of [['online','온라인 · 친구/다른 플레이어'],['ai','AI · 혼자 플레이']]){const option=document.createElement('option');option.value=value;option.textContent=text;mode.append(option);}label.append(mode);form.prepend(label);
            const access=form.querySelector('[name=access]'),password=form.querySelector('[name=password]');
            const updateAccess=access.onchange;
            const syncAccess=()=>{
                const ai=mode.value==='ai';
                access.closest('label').style.display=ai?'none':'flex';
                access.disabled=ai;password.disabled=ai;
                if(ai){password.required=false;password.value='';form.querySelector('[data-password-label]').style.display='none';}
                else updateAccess();
            };
            mode.onchange=syncAccess;access.onchange=syncAccess;syncAccess();
            form.querySelector('small').textContent='0G는 무료 · 대결 전용 가상 배팅 · 실제 계좌에 영향 없음';
            form.onsubmit=async e=>{e.preventDefault();if(mode.value==='ai'){await submit(e);return;}const data=new FormData(form);const target=form.querySelector('button');target.disabled=true;try{const state=await this.arenaRequest({action:'create',room:{name:String(data.get('name')).trim(),minutes:Number(data.get('minutes')),cash:Number(data.get('cash')),stake:Number(data.get('stake')),passwordHash:data.get('access')==='locked'?await hash(String(data.get('password'))):null}});this.onlineState=state;this.renderOnlineRoom(state);await this.refreshPublicRooms();}catch(error){this.dialog.querySelector('[data-status]').textContent=error.message;}finally{target.disabled=false;}};
            this.dialog.querySelector('[data-friends]')?.nextElementSibling?.remove();
            const friendForm=this.dialog.querySelector('[data-friend]');
            const friendInput=friendForm.elements.namedItem('name');
            friendInput.value=this.friendQuery||'';
            friendForm.onsubmit=e=>{e.preventDefault();this.friendQuery=friendInput.value.trim();void this.refreshFriends();};
            friendInput.oninput=()=>{if(!friendInput.value.trim()){this.friendQuery='';void this.refreshFriends();}};

            const finder=this.dialog.querySelector('[data-find]');finder.onsubmit=async e=>{e.preventDefault();const list=this.dialog.querySelector('[data-find-results]');list.replaceChildren();try{const {rooms}=await this.arenaRequest({action:'find',query:String(new FormData(finder).get('query'))});for(const room of rooms)list.append(this.onlineRoomCard(room));this.dialog.querySelector('[data-find-status]').textContent=rooms.length?'검색 결과':'검색 결과가 없습니다.';}catch(error){this.dialog.querySelector('[data-find-status]').textContent=error.message;}};
            if(this.onlineState)this.renderOnlineRoom(this.onlineState);
            void this.refreshFriends();
            this.dialog.querySelector('header').append(button('전적 보기',()=>this.showArenaHistory()));
        },
        async showArenaHistory(){
            const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
            const popup=make('dialog','arena-history');popup.setAttribute('aria-label','모의투자 전적');
            const style=document.createElement('style');style.textContent=`
                dialog.arena-history{position:fixed;inset:0;box-sizing:border-box;width:min(680px,calc(100vw - 32px));max-width:none;max-height:calc(100dvh - 40px);margin:auto;padding:28px;border:1px solid #334356;border-radius:18px;background:#101c2a;color:#eaf0f6;box-shadow:0 28px 100px #0008;font:inherit;overflow:auto}
                dialog.arena-history[open]{display:flex;flex-direction:column;gap:20px}
                .arena-history::backdrop{background:#040b14c9;backdrop-filter:blur(6px)}
                .arena-history .history-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 0 20px;border-bottom:1px solid #2b3b4c;flex-shrink:0}
                .arena-history .history-eyebrow{display:block;color:#d9bd7c;font-size:10px;letter-spacing:2.5px;margin-bottom:10px}
                .arena-history .history-title{font-size:24px;letter-spacing:-.6px;margin:0}
                .arena-history .history-count{font-size:12px;color:#9aafc2;white-space:nowrap}
                .arena-history .history-list{display:grid;gap:14px;overflow:auto;min-height:0;overscroll-behavior:contain}
                .arena-history .history-card{background:#152536;border:1px solid #2b3e51;border-radius:12px;padding:20px;min-width:0}
                .arena-history .history-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
                .arena-history .history-room{font-size:15px;color:#e7edf4;margin:0;line-height:1.6;overflow-wrap:anywhere}
                .arena-history .history-meta{display:block;color:#92a7bc;font-size:11px;line-height:1.7;margin-top:5px;letter-spacing:0}
                .arena-history .history-rank{padding:5px 10px;border-radius:6px;background:#203449;color:#bdd0e3;white-space:nowrap;font-size:12px;font-weight:700}
                .arena-history .history-rank.winner{background:#393526;color:#e8cb86}
                .arena-history .history-stats{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:18px;padding-top:16px;border-top:1px solid #2c4053}
                .arena-history .history-stats span{display:block;color:#92a7bc;font-size:11px;margin-bottom:7px}
                .arena-history .history-stats strong{font-size:19px;font-weight:600;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
                .arena-history .history-winner{font-size:12px;line-height:1.7;color:#a6b8ca;margin:16px 0 0;overflow-wrap:anywhere}
                .arena-history .history-notice{color:#afbed0;font-size:12px;line-height:1.7;margin:0}
                .arena-history .history-notice:empty{display:none}
                .arena-history .history-empty{color:#9aafc2;text-align:center;font-size:14px;padding:32px 12px;margin:0;line-height:1.8}
                .arena-history .history-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-top:18px;border-top:1px solid #2b3b4c;flex-shrink:0}
                .arena-history .history-footer p{color:#8fa4b9;font-size:11px;line-height:1.8;margin:0}
                .arena-history .history-close{background:#1b2d40;color:#e4edf6;border:1px solid #3a5066;padding:10px 20px;border-radius:8px;font:inherit;font-size:13px;cursor:pointer;min-height:42px;white-space:nowrap}
                .arena-history .history-close:hover{background:#263c52}.arena-history .history-close:focus-visible{outline:2px solid #d9bd7c;outline-offset:3px}
                @media(max-width:480px){dialog.arena-history{padding:22px 16px}.arena-history .history-card{padding:16px}.arena-history .history-stats{gap:12px}.arena-history .history-stats strong{font-size:17px}}
            `;
            const header=make('header','history-header'),heading=make('div','');
            heading.append(make('small','history-eyebrow','MATCH HISTORY'),make('h2','history-title','모의투자 전적'));
            const count=make('span','history-count','불러오는 중');header.append(heading,count);
            const notice=make('p','history-notice');notice.setAttribute('role','status');
            const list=make('div','history-list');list.append(make('p','history-empty','대결 기록을 불러오고 있습니다.'));
            const footer=make('footer','history-footer');
            const close=button('닫기',()=>{popup.close();popup.remove();});close.className='history-close';
            footer.append(make('p','','모의투자 전용 기록 · 실제 지급액 0 G'),close);
            popup.append(style,header,notice,list,footer);this.dialog.append(popup);
            popup.addEventListener('cancel',e=>{e.preventDefault();popup.close();popup.remove();});popup.showModal();close.focus();
            let local=[],records=[];
            try{local=JSON.parse(localStorage.getItem('stockwars.arena.aiHistory')||'[]');if(!Array.isArray(local))local=[];}catch{notice.textContent='일부 AI 전적을 불러오지 못했습니다.';}
            try{({records=[]}=await this.arenaRequest({action:'history'}));}catch{notice.textContent='온라인 전적을 불러오지 못했습니다. 저장된 AI 전적만 표시합니다.';}
            if(!popup.open)return;
            const history=[...records,...local].sort((a,b)=>b.ended-a.ended);list.replaceChildren();count.textContent=`총 ${history.length}회`;
            for(const record of history){
                const results=record.results||[],mine=results.find(p=>p.isOwn),winners=results.filter(p=>p.rank===1&&!p.forfeited);
                const card=make('section','history-card'),top=make('div','history-card-head'),identity=make('div','');
                identity.append(make('h3','history-room',record.name),make('time','history-meta',`${record.ai?'AI 대결':'온라인 대결'} · ${new Date(record.ended).toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}`));
                const won=mine?.rank===1&&!mine.forfeited;
                const rank=mine?.forfeited?'중도 포기':mine?.rank?`${won&&winners.length>1?'공동 ':''}${mine.rank}위`:'순위 없음';
                top.append(identity,make('span',`history-rank${won?' winner':''}`,rank));
                const stats=make('div','history-stats');
                for(const [label,value] of [['내 최종 자산',mine?`${Math.round(mine.assets||0).toLocaleString()} G`:'—'],['가상 배당',mine?`${(mine.payout||0).toLocaleString()} G`:'—']]){const cell=make('div','');cell.append(make('span','',label),make('strong','',value));stats.append(cell);}
                card.append(top,stats,make('p','history-winner',`${winners.length>1?'공동 승자':'승자'} · ${winners.map(p=>p.name).join(', ')||'없음'}`));list.append(card);
            }
            if(!history.length)list.append(make('p','history-empty','아직 완료한 대결이 없습니다. 첫 대결을 마치면 여기에 기록됩니다.'));
        },
        returnToArenaLobby(){this.resultDialog?.close();this.resultDialog?.remove();this.resultDialog=null;this.match?.close();this.onlineState=null;this.onlineMatchId=null;this.resultConfirmed=false;this.pendingArenaOrder=null;this.render();void this.refreshPublicRooms();},
        async refreshFriends(){
            const list=this.dialog.querySelector('[data-friends]');if(!list)return;
            const requestId=this.friendRefreshId=(this.friendRefreshId||0)+1;
            if(!window.stockWarsChat?.friends){list.textContent='서버에 연결하면 온라인 친구를 확인할 수 있습니다.';return;}
            try{
                const state=await window.stockWarsChat.friends('list');
                if(requestId!==this.friendRefreshId||list!==this.dialog.querySelector('[data-friends]'))return;
                if(state.error)throw new Error(state.error);
                const query=(this.friendQuery||'').normalize('NFC').toLocaleLowerCase();
                const friends=(state.friends||[]).filter(friend=>friend.online&&(!query||friend.name.normalize('NFC').toLocaleLowerCase()===query));
                list.replaceChildren();
                if(!friends.length){const p=document.createElement('p');p.textContent=query?'해당 닉네임의 온라인 친구가 없습니다.':'현재 접속 중인 친구가 없습니다.';list.append(p);}
                for(const friend of friends){
                    const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #344e68';
                    const name=document.createElement('span');name.textContent=friend.name;name.style.cssText='flex:1;min-width:0;overflow-wrap:anywhere';row.append(name);
                    const invite=button('초대',async()=>{try{await this.arenaRequest({action:'invite',id:this.onlineState.room.id,targetName:friend.name});this.dialog.querySelector('[data-status]').textContent=`${friend.name}님에게 초대를 보냈습니다.`;}catch(e){this.dialog.querySelector('[data-status]').textContent=e.message;}});
                    invite.disabled=!this.onlineState?.isHost||this.onlineState.phase!=='waiting';invite.title=invite.disabled?'방을 만든 뒤 접속 중인 친구를 초대하세요.':'이 방으로 초대';row.append(invite);list.append(row);
                }
            }catch(e){if(requestId===this.friendRefreshId)list.textContent=e.message;}
        },
        onlineRoomCard(room){const card=document.createElement('section');card.style.cssText='padding:14px;border:1px solid #456075;border-radius:12px;margin:12px 0';const title=document.createElement('p');title.textContent=`${room.locked?'🔒 ':''}${room.name} · ${room.host} · ${room.count}/8명 · ${room.minutes}분`;card.append(title,button('참가',()=>this.requestJoin(room)));return card;},
        paintPublicRooms(){
            const list=this.dialog.querySelector('[data-public-rooms]');if(!list)return;
            const rooms=(this.publicRooms||[]).filter(room=>!room.locked);
            list.replaceChildren();
            this.dialog.querySelector('[data-public-status]').textContent=this.publicError||(rooms.length?'참가할 방을 선택하세요.':'아직 열린 공개방이 없습니다. 새 대결을 만들어 보세요.');
            for(const room of rooms)list.append(this.onlineRoomCard(room));
        },
        async refreshPublicRooms(){if(this.publicLoading)return;this.publicLoading=true;try{const result=await this.arenaRequest({action:'list'});this.publicRooms=result.rooms;this.invites=result.invitations;this.serverOwnRooms=result.ownRooms;this.publicError=null;if(this.onlineState){const roomId=this.onlineState.room.id;const state=await this.arenaRequest({action:'state',id:roomId});if(this.onlineState?.room.id!==roomId)return;this.onlineState=state;if(state.phase==='running'||state.phase==='finished')this.updateOnlineMatch(state);else this.renderOnlineRoom(state);}}catch(error){this.publicError=error.message;if(this.onlineState?.phase==='finished'&&error.message.includes('방이 종료'))this.returnToArenaLobby();}finally{this.publicLoading=false;if(this.dialog.open){this.paintPublicRooms();await this.refreshFriends();}}},
        async requestJoin(room){if(!room.online){return originalJoin.call(this,room);}let passwordHash;if(room.locked&&!this.invites?.some(r=>r.id===room.id)&&!this.serverOwnRooms?.some(r=>r.id===room.id)){const popup=document.createElement('dialog');popup.className='settings-dialog';const label=document.createElement('p');label.textContent=`${room.name} · 비밀번호`;const input=document.createElement('input');input.type='password';input.maxLength=32;const status=document.createElement('p');popup.append(label,input,status,button('참가',async()=>{try{const state=await this.arenaRequest({action:'join',id:room.id,passwordHash:await hash(input.value)});popup.close();popup.remove();this.enterOnline(state);}catch(e){status.textContent=e.message;}}),button('닫기',()=>{popup.close();popup.remove();}));this.dialog.append(popup);popup.showModal();return;}try{this.enterOnline(await this.arenaRequest({action:'join',id:room.id,passwordHash}));}catch(e){this.dialog.querySelector('[data-status]').textContent=e.message;}},
        enterOnline(state){this.onlineState=state;if(state.phase==='waiting')this.renderOnlineRoom(state);else this.updateOnlineMatch(state);void this.refreshFriends();},
        renderOnlineRoom(state) {
            const main=this.dialog.querySelector('.training-workspace>main');if(!main)return;
            main.replaceChildren();main.classList.add('online-waiting-room');
            const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
            const header=make('div','arena-wait-header');
            const heading=make('div','');heading.append(make('small','arena-wait-eyebrow','ONLINE ARENA'),make('h3','arena-wait-title',state.room.name));
            header.append(heading,make('span','arena-wait-badge','대기 중'));main.append(header);
            const info=make('div','arena-wait-info');
            for(const [label,value] of [['대결 시간',state.room.minutes+'분'],['시작 자금',state.room.cash.toLocaleString()+' G']]){const cell=make('div','');cell.append(make('span','',label),make('strong','',value));info.append(cell);}main.append(info);
            const code=make('details','arena-wait-code');code.append(make('summary','','방 코드 보기'),make('code','',state.room.id));main.append(code);
            main.append(make('h4','arena-roster-title','참가자 · '+state.members.length+'명'));
            const roster=make('div','arena-wait-roster');
            for(const member of state.members){
                const card=make('div','arena-member');const identity=make('div','arena-member-identity');identity.append(make('span','arena-member-avatar','👤'));
                const text=make('div','');text.append(make('strong','',member.name),make('small','',[(member.isHost?'방장':'참가자'),...(member.isOwn?['나']:[]),...(member.online?[]:['오프라인'])].join(' · ')));identity.append(text);
                card.append(identity,make('span','arena-member-state'+(member.ready?' ready':''),member.ready?'준비 완료':'준비 중'));roster.append(card);
            }main.append(roster);
            const mine=state.members.find(m=>m.isOwn),actions=make('div','arena-wait-actions');
            actions.append(button(mine?.ready?'준비 취소':'준비하기',async()=>{
                this.onlineState=await this.arenaRequest({action:'ready',id:state.room.id,ready:!mine?.ready});this.renderOnlineRoom(this.onlineState);
            }));
            if(state.isHost){const launch=button('대결 시작',async()=>{try{this.enterOnline(await this.arenaRequest({action:'start',id:state.room.id}));}catch(e){this.dialog.querySelector('[data-status]').textContent=e.message;}});launch.className='arena-start-button';actions.append(launch);}
            const leave=button('방 나가기',async()=>{await this.arenaRequest({action:'leave',id:state.room.id});this.onlineState=null;this.render();});leave.className='arena-leave-button';actions.append(leave);main.append(actions);
        },
        showOnlineExitChoices(){
            if(this.onlineExitDialog?.open)return;
            const popup=document.createElement('dialog');popup.className='settings-dialog';popup.setAttribute('aria-label','대결 포기 후 선택');
            const title=document.createElement('h2');title.textContent='대결을 포기할까요?';
            const note=document.createElement('p');note.textContent='두 선택 모두 중도 포기로 기록됩니다. 관전 중에는 거래할 수 없습니다.';note.style.cssText='color:#a5b8cb;font-size:13px;line-height:1.8';
            const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='color:#edb8a6;font-size:13px';
            const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;justify-content:flex-end;margin-top:24px;flex-wrap:wrap';
            const choose=async spectate=>{
                for(const b of actions.children)b.disabled=true;
                popup.dataset.busy='true';
                try{await this.forfeitOnlineMatch(spectate);popup.close();popup.remove();}
                catch(error){status.textContent=error.message;}
                finally{delete popup.dataset.busy;for(const b of actions.children)b.disabled=false;}
            };
            const leave=button('방 나가기',()=>choose(false)),watch=button('관전하기',()=>choose(true));
            watch.style.cssText='background:#d9b969;border-color:#d9b969;color:#18202b;font-weight:700';
            actions.append(leave,watch);popup.append(title,note,status,actions);this.match.dialog.append(popup);this.onlineExitDialog=popup;
            popup.addEventListener('cancel',e=>{e.preventDefault();if(!popup.dataset.busy){popup.close();popup.remove();}});
            popup.showModal();watch.focus();
        },
        async forfeitOnlineMatch(spectate){
            const match=this.match,id=this.onlineMatchId;
            if(this.onlineForfeitPending)return;
            this.onlineForfeitPending=true;
            try{
                await this.arenaRequest({action:'leave',id});
                if(this.match!==match||this.onlineMatchId!==id)return;
                this.onlineLeaveSent=true;this.pendingArenaOrder=null;
                if(spectate){
                    this.onlineSpectating=true;
                    this.updateOnlineMatch(this.onlineState);
                }else match.closeDirect();
            }finally{this.onlineForfeitPending=false;}
        },
        updateOnlineMatch(state){
            if(this.resultConfirmed&&state.allConfirmed){this.returnToArenaLobby();return;}
            if(this.onlineMatchId!==state.room.id){this.match?.dialog.remove();const engine=new MarketEngine();engine.stopEngine();this.onlineEngine=engine;this.match=new CipherTrainingRoom(this.container,engine);this.onlineMatchId=state.room.id;this.resultShown=false;this.onlineSpectating=false;this.onlineLeaveSent=false;this.match.dialog.querySelector('h2').textContent=`${state.room.name} · 온라인`;this.onlineStatus=document.createElement('p');this.onlineStatus.style.cssText='padding:14px;color:#f5d583;background:#142c3e';this.match.dialog.querySelector('header').after(this.onlineStatus);this.onlineNews=this.createNewsPanel(this.match);this.seenOnlineNews=new Set();this.match.usesServerOrders=true;this.match.order=side=>this.onlineOrder(side);this.match.closeDirect=this.match.close.bind(this.match);this.match.close=()=>{if(this.onlineState?.phase==='running'&&!this.onlineSpectating)this.showOnlineExitChoices();else this.match.closeDirect();};this.match.onClose=()=>{if(!this.onlineLeaveSent)void this.arenaRequest({action:'leave',id:state.room.id}).catch(()=>{});this.onlineExitDialog?.close();this.onlineExitDialog?.remove();this.onlineState=null;this.onlineMatchId=null;this.onlineEngine.stopEngine();this.render();};this.match.open();}
            this.onlineState=state;
            if(state.members.some(p=>p.isOwn&&p.forfeited))this.onlineSpectating=true;
            this.match.dialog.querySelector('[data-close]').textContent=state.phase==='running'?(this.onlineSpectating?'관전 종료 · 방 나가기':'대결 포기'):'대결 로비로 돌아가기';
            if(state.phase==='finished'){this.onlineExitDialog?.close();this.onlineExitDialog?.remove();}
            const engine=this.onlineEngine;engine.cash=state.market.cash;engine.initialCash=state.room.cash;engine.stocks=new Map(state.market.stocks.map(s=>[s.id,s]));engine.priceHistory=new Map(Object.entries(state.histories));engine.portfolio=new Map(state.market.portfolio.map(p=>[`${p.id}_LONG_1`,{id:p.id,qty:p.qty,avgPrice:p.avgPrice,collateral:p.collateral,leverage:1,isShort:false}]));engine.news=state.market.news;engine.notify();
            const ordered=state.members.filter(p=>!p.forfeited&&!(this.onlineSpectating&&p.isOwn)).sort((a,b)=>b.assets-a.assets);this.onlineStatus.textContent=`${this.onlineSpectating?'관전 중 · ':''}남은 시간 ${Math.floor(state.remaining/60)}:${String(state.remaining%60).padStart(2,'0')} · ${ordered.map((p,i)=>`${i+1}위 ${p.name} ${Math.round(p.assets).toLocaleString()}G`).join(' / ')}`;
            for(const news of [...state.market.news].reverse()){if(this.seenOnlineNews.has(news.id))continue;this.seenOnlineNews.add(news.id);this.addNewsCard(this.match,this.onlineNews,{stock:engine.stocks.get(news.stockId),title:news.title,detail:news.content,time:new Date(news.time).toLocaleTimeString('ko-KR')});}
            for(const side of ['buy','sell'])this.match.dialog.querySelector(`[data-${side}]`).disabled=state.phase!=='running'||this.onlineSpectating||!!this.pendingArenaOrder||this.onlineForfeitPending;
            if(state.phase==='finished'&&!this.resultShown){this.resultShown=true;this.resultConfirmed=false;const results=document.createElement('dialog');this.resultDialog=results;results.className='settings-dialog';results.setAttribute('aria-label','온라인 대결 결과');const title=document.createElement('h2');const winners=(state.results||[]).filter(r=>r.rank===1&&!r.forfeited);title.textContent=winners.length?`승자: ${winners.map(r=>r.name).join(', ')}`:'대결 종료 · 승자 없음';results.append(title);for(const r of state.results||[]){const p=document.createElement('p');p.textContent=`${r.rank}위 ${r.name}${r.isOwn?' · 나':''} · 최종 자산 ${Math.round(r.assets).toLocaleString()}G · 가상 배당 ${(r.payout||0).toLocaleString()}G · 배팅 손익 ${(r.netPayout||0).toLocaleString()}G${r.forfeited?' · 포기':''}`;results.append(p);}const note=document.createElement('p');note.textContent='모의투자 전용 가상 배당입니다. 실제 계좌 지급액은 0G입니다.';const progress=document.createElement('p');progress.dataset.confirmations='';results.append(note,progress,button('확인',async()=>{const acknowledged=await this.arenaRequest({action:'ack',id:state.room.id});this.resultConfirmed=true;results.querySelector('button').disabled=true;results.querySelector('button').dataset.locked='true';results.querySelector('button').textContent='다른 참가자 확인 대기';this.updateOnlineMatch(acknowledged);}));results.addEventListener('cancel',e=>e.preventDefault());this.match.dialog.append(results);results.showModal();}
            if(this.resultDialog?.open)this.resultDialog.querySelector('[data-confirmations]').textContent=`확인 ${state.confirmed||0}/${state.participants||state.members.length}명 · 모두 확인하면 로비로 돌아갑니다.`;
            if(this.pendingArenaOrder&&!this.orderLoading&&!this.onlineSpectating&&!this.onlineForfeitPending)void this.onlineOrder(this.pendingArenaOrder.side);
        },
        async onlineOrder(side){if(this.orderLoading||this.onlineSpectating||this.onlineForfeitPending||this.onlineState?.phase!=='running')return;this.orderLoading=true;const match=this.match;this.pendingArenaOrder ||= {action:'trade',id:this.onlineState.room.id,side,stockId:match.selected,quantity:Number(match.dialog.querySelector('[type=number]').value),requestId:crypto.randomUUID()};try{const state=await this.arenaRequest(this.pendingArenaOrder);if(this.match!==match||this.onlineMatchId!==state.room.id)return;this.pendingArenaOrder=null;this.onlineState=state;this.updateOnlineMatch(state);match.dialog.querySelector('.training-result').textContent=`${state.trade.side==='buy'?'매수':'매도'} ${state.trade.quantity}주 · 체결가 ${state.trade.price.toLocaleString()}G`;}catch(e){if(!e.retryable)this.pendingArenaOrder=null;match.dialog.querySelector('.training-result').textContent=e.message;}finally{this.orderLoading=false;}}
    });
}
