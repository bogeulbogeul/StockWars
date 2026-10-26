const people=[
 {id:'moa',name:'모아',role:'정착 안내소',color:'#d4e1bc',time:'오후 7:02',preview:'마을 생활은 조금 익숙해졌어?',unread:true,icon:'leaf',messages:['소망아, 마을 생활은 조금 익숙해졌어?','궁금한 게 있으면 안내소에 들러줘. 따뜻한 차도 준비해둘게.']},
 {id:'tori',name:'토리',role:'증권사',color:'#c5dbe7',time:'오후 6:48',preview:'오늘의 시장도 천천히 살펴봐.',unread:true,icon:'crystal',messages:['오늘의 시장도 천천히 살펴봐.','궁금한 기업은 주식 앱에서 하나씩 알아보면 좋아.']},
 {id:'chagok',name:'차곡이',role:'은행',color:'#f1db9c',time:'오후 5:30',preview:'작은 저축도 차곡차곡 모이면 커져.',icon:'seed',messages:['작은 저축도 차곡차곡 모이면 커져.','마을에 오면 언제든 반갑게 맞아줄게.']},
 {id:'bong',name:'봉봉',role:'잡화점',color:'#ecc5b5',time:'오후 4:15',preview:'오늘도 수고했어. 푹 쉬어!',icon:'flower',messages:['오늘도 수고했어. 푹 쉬어!','다음에 잡화점에 들르면 또 이야기하자.']}
];
const shapes={leaf:'<path d="M24 27C9 27 7 14 8 8c13 0 20 7 16 19Zm0 0C22 12 32 5 41 6c1 12-5 22-17 21Z" fill="#759d69"/><path d="M24 25v13" stroke="#759d69" stroke-width="3" stroke-linecap="round"/>',crystal:'<path d="m24 5 13 12-4 20H15l-4-20Z" fill="#6d99b4"/><path d="m24 5-5 14 5 18 5-18Z" fill="#a1c9dc"/>',seed:'<ellipse cx="24" cy="24" rx="11" ry="16" transform="rotate(28 24 24)" fill="#b89547"/><path d="m18 35 12-23" stroke="#ead59a" stroke-width="2"/>',flower:'<g fill="#cc8e7f"><circle cx="24" cy="13" r="8"/><circle cx="35" cy="22" r="8"/><circle cx="30" cy="35" r="8"/><circle cx="16" cy="34" r="8"/><circle cx="13" cy="21" r="8"/></g><circle cx="24" cy="24" r="8" fill="#fff1bc"/>'};
const avatar=p=>`<div class="avatar" style="--color:${p.color}"><svg viewBox="0 0 48 48" aria-hidden="true">${shapes[p.icon]}</svg></div>`;
let filter='all',selected=people[0];
function list(){const query=document.querySelector('input').value.trim();document.querySelector('#conversations').innerHTML=people.filter(p=>(filter==='all'||p.unread)&&p.name.includes(query)).map(p=>`<button class="conversation" data-id="${p.id}">${avatar(p)}<div class="conversation-content"><div class="conversation-top"><strong>${p.name}</strong><time>${p.time}</time></div><div class="conversation-bottom"><p>${p.preview}</p>${p.unread?'<span class="unread">1</span>':''}</div></div></button>`).join('')||'<p class="endnote">해당하는 대화가 없어요.</p>';}
function chat(p){selected=p;document.querySelector('#chatAvatar').innerHTML=avatar(p);document.querySelector('#chatName').textContent=p.name;document.querySelector('#chatRole').textContent=p.role;document.querySelector('.messages').innerHTML=p.messages.map(t=>`<div class="bubble">${t}</div>`).join('')+'<time class="message-time">오후 7:02</time>';document.querySelectorAll('[data-reply]').forEach(b=>b.disabled=false);}
document.querySelector('input').oninput=list;
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));list();});
document.querySelector('#conversations').onclick=e=>{const id=e.target.closest('[data-id]')?.dataset.id;if(id)chat(people.find(p=>p.id===id));};
document.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>{const messages=document.querySelector('.messages');const bubble=document.createElement('div');bubble.className='bubble mine';bubble.textContent=b.dataset.reply;messages.append(bubble);messages.scrollTop=messages.scrollHeight;b.disabled=true;});
document.querySelector('.back').onclick=()=>document.querySelector('input').focus();
document.querySelectorAll('.home').forEach(b=>b.onclick=()=>{document.querySelector('.board-title').scrollIntoView({behavior:'smooth'});});
list();chat(selected);document.body.dataset.ready='true';
