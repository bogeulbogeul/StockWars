// Matches NewsEventScheduler.cs. Uses the local clock, as does MainHUD.
export const NEWS_BROADCAST_HOURS = [8, 11, 14, 17, 20];
export const NEWS_BROADCAST_MINUTES = 5;

export function getBillboardBroadcast(date, news, ads) {
    const isNewsTime = NEWS_BROADCAST_HOURS.includes(date.getHours()) &&
        date.getMinutes() < NEWS_BROADCAST_MINUTES;
    const items = isNewsTime ? news.filter(item => item.type !== '찌라시') : ads;
    const elapsedSeconds = date.getMinutes() * 60 + date.getSeconds();
    const item = items[Math.floor(elapsedSeconds / 8) % items.length];
    if (isNewsTime) {
        return {
            type: 'breaking',
            badge: `정시 뉴스 · ${String(date.getHours()).padStart(2, '0')}:00`,
            text: item?.title || '현재 발표된 뉴스가 없습니다.',
            title: 'LIVE NEWS'
        };
    }
    return {
        type: item?.type || 'ad',
        badge: item?.badge || '사이퍼 센트럴',
        text: item?.text || '사이퍼 타운에 오신 것을 환영합니다.',
        title: 'TOWN AD'
    };
}

export function formatCipherIndex(index) {
    const change = Number(index.diffPct);
    const direction = change > 0 ? '▲ +' : change < 0 ? '▼ ' : '';
    return `사이퍼 지수 ${Number(index.val).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${index.unit || 'pts'}  ${direction}${change.toFixed(2)}%`;
}
