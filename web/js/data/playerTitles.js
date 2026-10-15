export const PLAYER_TITLES = {
    trait_analysis: { trait: 'analysis', names: { ko: '예리한 분석가', en: 'Keen Analyst' }, image: 'trait-analysis-v1-no-text.png' },
    trait_negotiation: { trait: 'negotiation', names: { ko: '베테랑 협상가', en: 'Veteran Negotiator' }, image: 'trait-negotiation-v1-no-text.png' },
    trait_management: { trait: 'management', names: { ko: '공격적 자산가', en: 'Bold Investor' }, image: 'trait-management-v1-no-text.png' },
    trait_recovery: { trait: 'recovery', names: { ko: '불굴의 트레이더', en: 'Resilient Trader' }, image: 'trait-recovery-v1-no-text.png' },
    challenge_net_profit_v1: { names: { ko: '수익의 맛', en: 'Taste of Profit' }, image: 'profit-v1-no-text.png' },
    challenge_profit_streak_v1: { names: { ko: '승부사', en: 'Winning Streak' }, image: 'seungbusa-v2-no-text.png' },
    challenge_logistics_s_v1: { names: { ko: '물류의 달인', en: 'Logistics Ace' }, image: 'logistics-v1-no-text.png' },
    challenge_flawless_v1: { names: { ko: '빈틈없는', en: 'Flawless' }, image: 'flawless-v1-no-text.png' },
    challenge_agent_k_v1: { names: { ko: 'K를 넘은 자', en: 'Beyond K' }, image: 'k-victory-v1-no-text.png' }
};

export function titleLanguage(locale = globalThis.document?.documentElement?.lang || globalThis.navigator?.language || 'ko') {
    return String(locale).toLowerCase().startsWith('ko') ? 'ko' : 'en';
}
export function titleName(id, locale) {
    return PLAYER_TITLES[id]?.names[titleLanguage(locale)] || '';
}
