const milestone=(id,title,category,description,current,target,icon)=>({id,title,category,description,current:Math.max(0,Math.min(target,Number(current)||0)),target,icon,earned:Number(current)>=target});
export function storyAchievements(state){
 const f=state.flags||{};
 return [
 ['resident','포포리의 새 주민','생활','입주 신청서에 서명하고 이름을 등록해요.','nickname','sprout'],
 ['account','나의 첫 계좌','생활','차곡 은행에서 생활 계좌를 개설해요.','bank','wallet'],
 ['license','투자의 첫걸음','투자','투자 시험을 마치고 자격증을 받아요.','certificate','star'],
 ['first-share','처음 산 한 주','투자','주식 앱에서 첫 주식 한 주를 매수해요.','trade','chart'],
 ['packing','정성껏 포장한 하루','생활','봉봉 잡화점의 포장 알바를 마쳐요.','packing','box'],
 ['seed','작은 새싹의 시작','생활','내 화분에 씨앗을 심어요.','planted','sprout'],
 ['diary','오늘을 적는 마음','생활','다이어리에 첫 기록을 남겨요.','diaryWritten','book'],
 ['first-day','포포리의 첫날','생활','첫날의 활동을 마치고 잠자리에 들어요.','asleep','moon']
 ].map(([id,title,category,description,flag,icon])=>milestone(id,title,category,description,f[flag]?1:0,1,icon));
}
export function playerAchievements(app){
 const level=app.itemEngine?.playerLevel?.()||1,a=app.itemEngine?.analysisProgress?.();
 return [
 milestone('level5','한 걸음씩 자라는 나','성장','플레이어 레벨 5에 도달해요.',level,5,'sprout'),
 milestone('level10','차곡차곡 쌓은 하루','성장','플레이어 레벨 10에 도달해요.',level,10,'star'),
 milestone('analysis2','한층 깊은 시선','분석','분석력 2단계에 도달해요.',a?.level,2,'glass'),
 milestone('analysis3','이야기를 읽는 눈','분석','분석력 3단계에 도달해요.',a?.level,3,'glass'),
 milestone('quiz1','첫 번째 해석','분석','해석 확인 퀴즈에서 처음으로 정답 숙련도를 받아요.',a?.totalCorrect,1,'book'),
 milestone('quiz10','열 번의 깨달음','분석','서로 다른 사건에서 정답 숙련도를 10번 받아요.',a?.totalCorrect,10,'star')
 ];
}
const paths={sprout:'<path d="M24 39V22C11 24 6 15 7 7c13 0 20 5 17 15C21 9 30 4 41 6c1 13-6 19-17 16Z"/>',wallet:'<rect x="7" y="11" width="34" height="28" rx="5"/><rect x="27" y="21" width="16" height="11" rx="3" fill="#f4d887"/><circle cx="33" cy="26" r="2"/>',star:'<path d="m24 5 5.6 11.4 12.6 1.8-9.1 8.9 2.1 12.6L24 33.8l-11.2 5.9 2.1-12.6-9.1-8.9 12.6-1.8Z"/>',chart:'<path d="M8 39V10h5v23h28v6Z"/><path d="m16 28 8-10 7 5 10-14v10l-9 12-7-6-6 7Z"/>',box:'<path d="m6 15 18-8 18 8v24H6Z"/><path d="M24 9v29M7 17l17 6 17-6" fill="none" stroke="#f4d887" stroke-width="3"/>',book:'<rect x="9" y="6" width="30" height="37" rx="4"/><path d="M17 15h15M17 23h15M17 31h10" fill="none" stroke="#f4d887" stroke-width="3"/>',moon:'<path d="M32 5a18 18 0 1 0 11 29A20 20 0 0 1 32 5Z"/>',glass:'<path d="M29 32a15 15 0 1 1 4-4l11 11-5 5Zm-10-4a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/>'};
export const achievementIcon=(key)=>`<svg viewBox="0 0 48 48" aria-hidden="true">${paths[key]||paths.star}</svg>`;
export const achievementText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
