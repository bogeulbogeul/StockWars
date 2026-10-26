// Read-only objectives for the active first-day story; no quest rewards or state writes.
export function exhibitionTasks(state) {
    const f=state.flags || {};
    const rows=[
        ['bank','생활 계좌 개설하기','차곡 은행','차곡이를 만나 생활 계좌를 만들어 보세요.',[['bank','생활 계좌 개설하기']]],
        ['packing','잡화점 포장 알바하기','봉봉 잡화점','구인 공고를 확인하고 봉봉에게 말을 걸어 보세요.',[['notice','구인 공고 읽기'],['packing','포장 알바 마치기']]],
        ['trade','첫 주식 매수하기','토리 증권사 · 주식 앱','토리에게 투자 자격을 확인받고 첫 주식을 사보세요.',[['certificate','투자 자격증 받기'],['trade','주식 앱에서 첫 매수하기']]],
        ['planted','내 화분에 씨앗 심기','소망이네 집','하루의 활동을 마친 뒤 집에서 씨앗을 심어 보세요.',[['pot','화분 준비하기'],['planted','씨앗 심기']]],
        ['diaryWritten','다이어리에 첫 기록 남기기','소망이네 집','다이어리를 받고 오늘의 첫 기록을 남겨 보세요.',[['diary','다이어리 받기'],['diaryWritten','첫 기록 남기기']]]
    ];
    return rows.filter(([id])=>f.order || id==='bank').map(([id,title,location,description,steps])=>({id:`story-${id}`,title,location,description,category:'마을 생활',done:!!f[id],steps:steps.map(([flag,title])=>({title,done:!!f[flag]}))}));
}
