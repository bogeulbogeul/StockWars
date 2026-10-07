/**
 * LogisticsRewardEngine
 * Handles grade calculations and reward settlements for Bit Logistics jobs.
 * GDD Reference: MOD_GDD_02_LaborJobs.md
 */

export function deliveryScore(count) {
    return [0, 1, 2, 4, 6][count] || 0;
}
export function calculateLogisticsGrade(score, highStackDeliveries = 0) {
    if (score >= 26 && highStackDeliveries >= 2) return 'S';
    if (score >= 18) return 'A';
    if (score >= 10) return 'B';
    return 'C';
}

export function isNightLogistics(time) {
    const hour = new Date(time + 9 * 60 * 60 * 1000).getUTCHours();
    return hour >= 22 || hour < 2;
}

export function calculateLogisticsSettlement(loadedCount, brokenCount, isFirstTime = false, startedAt = Date.now(), score = loadedCount, highStackDeliveries = 0) {
    const grade = calculateLogisticsGrade(score, highStackDeliveries);
    let goldReward = 100;
    let expReward = 10;
    let rumorChance = 0;
    let gradeLabel = 'C (기본 수고비 / 10점 미만)';

    if (grade === 'S') {
        goldReward = 800;
        expReward = 100;
        rumorChance = 0.30;
        gradeLabel = 'S (특급 기여 / 26점 이상 · 3단 이상 배송 2회)';
    } else if (grade === 'A') {
        goldReward = 560;
        expReward = 70;
        rumorChance = 0.15;
        gradeLabel = 'A (우수 기여 / 18점 이상)';
    } else if (grade === 'B') {
        goldReward = 320;
        expReward = 40;
        rumorChance = 0.05;
        gradeLabel = 'B (보통 / 10점 이상)';
    }

    const isNight = isNightLogistics(startedAt);
    if (isNight) rumorChance *= 2;

    let isJackpot = false;
    if (grade === 'S' && Math.random() < 0.00002) {
        goldReward = 8000;
        isJackpot = true;
    }

    // First time guarantees 100% rumor delivery; subsequent jobs follow grade probability
    const hasRumor = isFirstTime ? true : (Math.random() < rumorChance);

    return {
        grade,
        goldReward,
        expReward,
        hasRumor,
        rumorChance: isFirstTime ? 1 : rumorChance,
        isNight,
        isJackpot,
        gradeLabel,
        score,
        highStackDeliveries,
        loadedCount,
        brokenCount,
        isFirstTime
    };
}

