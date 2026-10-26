// Shared by existing conversations and future residents. Legacy IDs remain valid.
export const DIALOGUE_THEMES = Object.freeze({
    moa: { name: '모아', accent: '#BDD6A2', aliases: ['anna', '안나', '모아'] },
    bongbong: { name: '봉봉', accent: '#FFB99B', aliases: ['vivian', '비비안', '봉봉'] },
    woody: { name: '우디', accent: '#DCBA87', aliases: ['julian', '줄리안', '우디'] },
    tori: { name: '토리', accent: '#A9BDD8', aliases: ['agent_k', 'agent-k', '에이전트 K', '토리'] },
    chagok: { name: '차곡', accent: '#E9CD85', aliases: ['shylock', '샤일록', '차곡'] },
    doran: { name: '도란', accent: '#D2A4BD', aliases: ['andre', '안드레', '도란'] },
    boni: { name: '보니', accent: '#A9D9CB', aliases: ['claire', '클레어', '보니'] },
    sodam: { name: '소담', accent: '#C6B4DB', aliases: ['sofia', 'sophia', '소피아', '소담'] },
    duri: { name: '두리', accent: '#B6DAE9', aliases: ['두리'] },
    somang: { name: '소망', accent: '#E8DDC9', aliases: ['소망', '내레이션'] }
});

export function resolveDialogueTheme(speaker = '') {
    const value = String(speaker);
    if (Object.hasOwn(DIALOGUE_THEMES, value)) return value;
    return Object.entries(DIALOGUE_THEMES).find(([, theme]) =>
        theme.aliases.some(alias => value.includes(alias)))?.[0] || 'somang';
}
