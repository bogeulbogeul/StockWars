export const SIDE_QUESTS = [
    { id: 'challenge_net_profit_v1', title: '실현 수익 1,000G', description: '의뢰 수락 이후 매도 손익 합계 1,000G를 달성하세요. 수수료를 반영하고 손실은 차감해요. 물류 수입과 보상금은 제외돼요.', giver: 'anna', event: 'trade', mode: 'netProfit', target: 1000, unit: 'G', gold: 350, exp: 50 },
    { id: 'challenge_profit_streak_v1', title: '세 번의 승부', description: '한 번에 순이익 100G 이상인 매도를 3회 연속 달성하세요. 100G 미만의 이익이나 손실이 나면 연속 횟수가 초기화돼요.', giver: 'anna', event: 'trade', mode: 'streak', target: 3, gold: 400, exp: 60 },
    { id: 'challenge_logistics_s_v1', title: '물류 에이스', description: '비트 물류 업무 한 판에서 30점 이상을 기록해 S등급을 달성하세요.', giver: 'park', event: 'labor', mode: 'bestScore', target: 30, unit: '점', gold: 300, exp: 50 },
    { id: 'challenge_flawless_v1', title: '무결점 배송', description: '상자를 하나도 파손하지 않고 물류 업무 한 판에서 18점 이상을 기록하세요. 파손이 발생한 판은 기록되지 않아요.', giver: 'park', event: 'labor', mode: 'flawlessScore', target: 18, unit: '점', gold: 350, exp: 50 },
    { id: 'challenge_agent_k_v1', title: '에이전트 K를 넘어라', description: '사이퍼 증권의 모의투자 경쟁룸에서 에이전트 K와 대결해 승리하세요. 제한 시간 종료 시 총자산이 더 많아야 해요. 무승부와 중도 포기는 제외돼요.', giver: 'agent_k', event: 'arena', mode: 'agentKWin', target: 1, unit: '승', gold: 500, exp: 80 }
];
