import { achievementIcon as icon,achievementText as esc } from './AchievementData.js';
export function mountAchievementsApp(phone,host,source){
 let filter='all',selected=null,signature='',alive=true;
 const read=()=>source.achievements?.()||[];
 function render(){
  if(!alive)return;const all=read(),earned=all.filter(a=>a.earned).length,a=all.find(a=>a.id===selected);
  signature=JSON.stringify(all);
  host.innerHTML=a?`<button class="phone-achieve-back" data-action="back">‹ 업적 목록</button><span class="phone-achieve-category">${esc(a.category)}</span><div class="phone-achieve-large ${a.earned?'earned':''}">${icon(a.icon)}</div><h3 class="phone-achieve-title">${esc(a.title)}</h3><p class="phone-achieve-state">${a.earned?'✓ 달성 완료':'아직 도전 중이에요'}</p><section class="phone-achieve-detail"><h4>달성 조건</h4><p>${esc(a.description)}</p>${progress(a)}<p class="phone-achieve-note">${a.earned?'플레이 기록에서 달성을 확인했어요.':'조건을 채우면 자동으로 달성 표시가 돼요.'}</p></section>`:`<h3>업적</h3><section class="phone-achieve-summary"><span>차곡차곡 모은 나의 발자취</span><div><strong>${earned}<small> / ${all.length}</small></strong>${icon('star')}</div><progress aria-label="전체 업적 달성률" max="${all.length||1}" value="${earned}"></progress></section><nav class="phone-achieve-filters" aria-label="업적 필터">${[['all','전체'],['earned','달성'],['progress','진행 중']].map(([key,text])=>`<button data-filter="${key}" aria-pressed="${filter===key}">${text}</button>`).join('')}</nav><div class="phone-achieve-list">${all.filter(x=>filter==='all'||(filter==='earned'?x.earned:!x.earned)).map(x=>`<button class="phone-achieve-card ${x.earned?'earned':''}" data-achievement="${x.id}"><span class="phone-achieve-icon">${icon(x.icon)}</span><span><small>${esc(x.category)} · ${x.earned?'✓ 달성':'진행 중'}</small><strong>${esc(x.title)}</strong><span class="phone-achieve-count">${x.current} / ${x.target}</span></span><b aria-hidden="true">›</b></button>`).join('')||'<p class="phone-achieve-empty">표시할 업적이 없어요.</p>'}</div><p class="phone-achieve-note">플레이 기록을 바탕으로 자동 갱신돼요.</p>`;
 }
 host.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.filter)filter=b.dataset.filter;if(b.dataset.achievement)selected=b.dataset.achievement;if(b.dataset.action==='back')selected=null;render();phone.detail.scrollTop=0;};
 phone.detail.classList.add('cozy-phone__detail--achievements');host.classList.add('phone-achievements');render();
 const timer=setInterval(()=>{if(JSON.stringify(read())!==signature)render();},500);
 return()=>{alive=false;clearInterval(timer);host.onclick=null;host.classList.remove('phone-achievements');phone.detail.classList.remove('cozy-phone__detail--achievements');};
}
function progress(a){return `<div class="phone-achieve-progress-label"><span>현재 진행</span><b>${a.current} / ${a.target}</b></div><progress max="${a.target}" value="${a.current}" aria-label="업적 진행률"></progress>`;}
