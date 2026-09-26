/**
 * LogisticsRewardEngine
 * Handles grade calculations and reward settlements for Bit Logistics jobs.
 * GDD Reference: MOD_GDD_02_LaborJobs.md
 */

export function calculateLogisticsGrade(loadedCount) {
    if (loadedCount >= 18) return 'S';
    if (loadedCount >= 12) return 'A';
    if (loadedCount >= 7) return 'B';
    return 'C';
}

export function calculateLogisticsSettlement(loadedCount, brokenCount, isFirstTime = false) {
    const grade = calculateLogisticsGrade(loadedCount);
    let goldReward = 100;
    let expReward = 10;
    let rumorChance = 0;
    let gradeLabel = 'C (기본 수고비 / 6개 이하)';

    if (grade === 'S') {
        goldReward = 800;
        expReward = 100;
        rumorChance = 0.30;
        gradeLabel = 'S (특급 기여 / 18개 이상)';
    } else if (grade === 'A') {
        goldReward = 560;
        expReward = 70;
        rumorChance = 0.15;
        gradeLabel = 'A (우수 기여 / 12~17개)';
    } else if (grade === 'B') {
        goldReward = 320;
        expReward = 40;
        rumorChance = 0.05;
        gradeLabel = 'B (보통 / 7~11개)';
    }

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
        isJackpot,
        gradeLabel,
        loadedCount,
        brokenCount,
        isFirstTime
    };
}

