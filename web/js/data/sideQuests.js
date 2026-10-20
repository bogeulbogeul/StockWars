export const SIDE_QUESTS = [
    { id: 'challenge_net_profit_v1', title: '실현 수익 1,000G', description: '의뢰 수락 이후 매도 손익 합계 1,000G를 달성하세요. 수수료를 반영하고 손실은 차감해요. 노동 수입과 보상금은 제외돼요.', giver: 'anna', event: 'trade', mode: 'netProfit', target: 1000, unit: 'G', gold: 350, exp: 50 },
    { id: 'challenge_profit_streak_v1', title: '세 번의 승부', description: '한 번에 순이익 100G 이상인 매도를 3회 연속 달성하세요. 100G 미만의 이익이나 손실이 나면 연속 횟수가 초기화돼요.', giver: 'anna', event: 'trade', mode: 'streak', target: 3, gold: 400, exp: 60 },
    { id: 'challenge_agent_k_v1', title: '토리를 넘어라', description: '사이퍼 증권의 모의투자 경쟁룸에서 토리와 대결해 승리하세요. 제한 시간 종료 시 총자산이 더 많아야 해요. 무승부와 중도 포기는 제외돼요.', giver: 'agent_k', event: 'arena', mode: 'agentKWin', target: 1, unit: '승', gold: 500, exp: 80 }
];
