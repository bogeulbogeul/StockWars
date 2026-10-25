import { clampAnalysis } from './RumorInterpretation.js';

export const ANALYSIS_REQUIREMENTS = [0, 20, 30, 40, 60, 0];
const OLD_REQUIREMENTS = [0, 6, 6, 10, 10, 10, 16, 16, 16, 20, 0];

export function initializeAnalysisGrowth(state) {
    const old = state.analysisGrowth;
    if (old?.version === 2) return old;
    if (old?.version === 1) {
        const oldLevel = Math.min(10, Math.max(1, Math.floor(Number(old.level) || 1)));
        const oldProgress = oldLevel === 10 ? 0 : Math.max(0, Number(old.proficiency) || 0);
        const cumulative = OLD_REQUIREMENTS.slice(1, oldLevel).reduce((a, b) => a + b, 0) + oldProgress;
        let level = 1, proficiency = cumulative;
        while (level < 5 && proficiency >= ANALYSIS_REQUIREMENTS[level]) {
            proficiency -= ANALYSIS_REQUIREMENTS[level++];
        }
        // Keep awards (including max-level amount:0 claims), sessions and unknown fields intact.
        old.migrationV2 = { oldLevel: old.level, oldProficiency: old.proficiency, cumulative };
        old.version = 2;
        old.level = level;
        old.proficiency = level === 5 ? 0 : proficiency;
        return old;
    }
    // Raw historic ownership remains in baseStats; no quiz claims are fabricated.
    state.analysisGrowth = { version: 2, level: clampAnalysis(state.baseStats?.analysis),
        proficiency: 0, awarded: {}, quizzes: {} };
    return state.analysisGrowth;
}
