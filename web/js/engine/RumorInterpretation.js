export const MAX_ANALYSIS = 5;
export const MAX_RUMOR_LEVEL = 5;
export const STAGE_LABELS = ['수수께끼와 제약', '회사와 사건', '조건과 현재 상태', '출처·범위·대안', '시점과 정보의 한계'];
export const clampAnalysis = value => Math.min(MAX_ANALYSIS, Math.max(1, Math.floor(Number(value) || 1)));
export const isAuthoredRumor = item => item?.rumorSchema === 3 && item.rumorStages?.length === 5;
export const maxRumorLevel = item => isAuthoredRumor(item) ? MAX_RUMOR_LEVEL : 5;
export const rumorLevel = (item, analysis) => Math.min(maxRumorLevel(item),
    Math.max(clampAnalysis(analysis), Math.floor(Number(item?.interpretationLevel) || 1)));

export function openAuthoredEnvelope(engine, draw) {
    const item = draw(engine.random, rumor => engine.market?.stocks?.has(rumor.targetStockId));
    if (!item) return { success: false, message: '열람 가능한 종목의 찌라시가 없습니다.' };
    // A unique inventory instance keeps powder, read state and gift ownership independent.
    item.id = engine.id('rumor');
    item.issuedAt = engine.now();
    item.isRead = true;
    item.readCount = 1;
    item.price = Math.max(100, Math.floor(item.price / 2));
    engine.state.inventory.push(item);
    return { success: true, rumorId: item.id, message: '소식 봉투에서 찌라시 한 건을 읽었어요. 1~5단계로 해석하며 진위는 따로 확인해야 해요.' };
}
