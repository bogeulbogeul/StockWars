import { MessengerSource } from './MessengerSource.js';
import { listView, addView, createView, chatView } from './MessengerViews.js';

export function mountMessengerApp(phone, host, source) {
    const app = new MessengerApp(host, new MessengerSource(source.messengerOnline));
    phone.detail.classList.add('cozy-phone__detail--messenger');
    app.start();
    return () => { app.destroy(); phone.detail.classList.remove('cozy-phone__detail--messenger'); };
}
class MessengerApp {
    constructor(host, source) {
        Object.assign(this, { host, source, view:'list', rooms:[], messages:[], social:{friends:[],incoming:[],outgoing:[]}, results:[], query:'', searchQuery:'', draft:'', note:'', alive:true });
        try { const saved=JSON.parse(localStorage.getItem('stockwars.messenger.read.v1') || '{}'); this.read=saved && typeof saved==='object' && !Array.isArray(saved) ? saved : {}; } catch { this.read = {}; }
        host.classList.add('phone-messenger');
        host.onclick = e => this.click(e);
        host.onsubmit = e => { e.preventDefault(); void this.submit(e.target); };
        host.oninput = e => {
            if (e.target.matches('[data-search]')) { this.query = e.target.value; const pos=e.target.selectionStart; this.render(); const input=host.querySelector('[data-search]'); input.focus(); input.setSelectionRange(pos,pos); }
            if (e.target.name === 'text') this.draft = e.target.value;
            if (e.target.name === 'member') { const n=host.querySelectorAll('[name="member"]:checked').length; host.querySelector('[data-count]').textContent=`선택한 친구 ${n}명 · 최대 20명`; const b=host.querySelector('[data-create]'); b.disabled=!n||n>20; b.textContent=n?`${n}명과 채팅 시작`:'친구를 선택해 주세요'; }
        };
    }
    async start() { this.render(); await this.refresh(); if (this.alive) this.timer=setInterval(()=>void this.refresh(),3000); }
    unread(room) { return room.lastMessage && room.lastMessage.playerId !== this.playerId && Number(room.lastMessage.id) > Number(this.read[room.id] || 0); }
    markRead() {
        const last=this.messages.at(-1); if (!last) return;
        this.read[this.roomId]=last.id;
        try { localStorage.setItem('stockwars.messenger.read.v1', JSON.stringify(this.read)); } catch {}
    }
    async refresh() {
        if (!this.source.online || this.refreshing || this.busy) return;
        this.refreshing=true;
        try {
            const [social, state]=await Promise.all([this.source.friends(),this.source.rooms()]);
            let messages=this.messages;
            if(this.view==='chat') messages=(await this.source.messages(this.roomId)).messages || [];
            if(!this.alive)return;
            const changed=JSON.stringify([social,state,messages])!==this.snapshot;
            this.snapshot=JSON.stringify([social,state,messages]);this.social=social;this.rooms=state.rooms||[];this.playerId=state.playerId;this.messages=messages;
            if(this.view==='chat')this.markRead();
            if(changed && ['list','chat'].includes(this.view))this.render();
        } catch(e) { if(this.alive){this.note=e.message;this.renderStatus();} } finally {this.refreshing=false;}
    }
    renderStatus() { const status=this.host.querySelector('[data-status]'); if(status)status.textContent=this.note; }
    render() {
        if(!this.alive)return;
        const active=this.host.contains(document.activeElement) ? document.activeElement : null;
        const restore=active?.name === 'text' ? {start:active.selectionStart,end:active.selectionEnd} : null;
        this.host.innerHTML=`<div class="messenger-offline" ${this.source.online?'hidden':''}></div><section class="messenger-view">${({list:listView,add:addView,create:createView,chat:chatView})[this.view](this)}</section><p class="messenger-status" data-status role="status" aria-live="polite"></p>`;
        this.host.querySelector('.messenger-offline').textContent='현재 로컬 모드예요. 친구 추가와 채팅은 서버에 연결된 게임에서 사용할 수 있어요.';
        this.renderStatus();
        if(this.view==='chat'){const messages=this.host.querySelector('.messenger-messages');messages.scrollTop=messages.scrollHeight;}
        if(restore){const input=this.host.querySelector('[name="text"]');input?.focus({preventScroll:true});input?.setSelectionRange(restore.start,restore.end);}
    }
    async run(task) {
        if(this.busy)return;this.busy=true;this.note='';
        this.host.querySelectorAll('button').forEach(b=>b.disabled=true);
        try { await task(); } catch(e) {this.note=e.message;} finally {this.busy=false;if(this.alive)this.render();}
    }
    click(e) {
        const button=e.target.closest('button');if(!button||this.busy)return;
        const d=button.dataset;
        if(d.action){if(d.action==='all'||d.action==='unread')this.onlyUnread=d.action==='unread';else this.view=d.action;this.note='';this.render();}
        if(d.room)void this.run(async()=>{this.roomId=d.room;this.messages=(await this.source.messages(d.room)).messages||[];this.draft='';this.view='chat';this.markRead();});
        const ops=[['request','results','request'],['accept','incoming','accept'],['reject','incoming','reject'],['cancel','outgoing','cancel']];
        for(const [key,list,action] of ops)if(d[key]!=null)void this.run(async()=>{const p=(list==='results'?this.results:this.social[list])[Number(d[key])];this.social=await this.source.friend(action,p);this.note=action==='request'?'친구 요청을 보냈어요. 상대의 수락을 기다려 주세요.':'요청을 처리했어요.';});
    }
    async submit(form) {
        const values=new FormData(form);
        if(form.dataset.form==='search')await this.run(async()=>{this.searchQuery=String(values.get('query')).trim();this.results=(await this.source.search(this.searchQuery)).players||[];if(!this.results.length)this.note='일치하는 친구가 없어요. 닉네임을 확인해 주세요.';});
        if(form.dataset.form==='create')await this.run(async()=>{const selected=values.getAll('member');const members=this.social.friends.filter(p=>selected.includes(String(p.id))).map(p=>p.id);if(!members.length||members.length>20)throw new Error('친구를 1~20명 선택해 주세요.');const title=String(values.get('title')).trim()||this.social.friends.filter(p=>members.includes(p.id)).map(p=>p.name).join(', ').slice(0,40);const result=await this.source.create(title,members);this.roomId=result.roomId;const state=await this.source.rooms();this.rooms=state.rooms||[];this.playerId=state.playerId;this.messages=(await this.source.messages(this.roomId)).messages||[];this.draft='';this.view='chat';});
        if(form.dataset.form==='send')await this.run(async()=>{const text=String(values.get('text')).trim();if(!text)throw new Error('메시지를 입력해 주세요.');await this.source.send(this.roomId,text);this.draft='';this.messages=(await this.source.messages(this.roomId)).messages||[];this.markRead();});
    }
    destroy(){this.alive=false;clearInterval(this.timer);this.host.onclick=this.host.onsubmit=this.host.oninput=null;this.host.classList.remove('phone-messenger');}
}
