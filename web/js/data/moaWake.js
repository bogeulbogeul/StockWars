export const MOA_WAKE_CALLS = 3;
export const MOA_SLEEP_TALK = [
    '모아가 의자에 앉아 꾸벅꾸벅 졸고 있어요.',
    '“으음…… 구름이…… 폭신해…….”',
    '“그 베개는…… 내 건데…….”'
];
export function nextMoaCall(count, nearby) {
    if (!nearby) return count;
    return Math.min(MOA_WAKE_CALLS, Math.max(0, Number(count) || 0) + 1);
}
