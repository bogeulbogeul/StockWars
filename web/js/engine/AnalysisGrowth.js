import { AUTHORED_RUMOR_ITEMS } from '../data/rumorCatalog.js';
import { clampAnalysis, isAuthoredRumor, rumorLevel } from './RumorInterpretation.js';
import { buildInterpretationQuestion } from './RumorQuizQuestions.js';
import { ANALYSIS_REQUIREMENTS, initializeAnalysisGrowth } from './AnalysisGrowthMigration.js';
export { ANALYSIS_REQUIREMENTS, initializeAnalysisGrowth } from './AnalysisGrowthMigration.js';

const events = new Map(AUTHORED_RUMOR_ITEMS.map(item => [item.rumorId, item]));
const fail = message => ({ success: false, message });
const wrongResolution = (question, state) => ({
    success: true, correct: false, concluded: true, amount: 0,
    correctIndex: question.correctIndex, answer: question.choices[question.correctIndex],
    message: '정답과 해설을 확인해 보세요. 이 사건은 숙련도 없이 종료됐어요.',
    explanation: question.explanation, progress: analysisProgress(state)
});

export function analysisProgress(state) {
    const growth = initializeAnalysisGrowth(state);
    const level = clampAnalysis(growth.level);
    const required = ANALYSIS_REQUIREMENTS[level];
    const current = level === 5 ? 0 : Math.max(0, Number(growth.proficiency) || 0);
    return { level, current, required, max: level === 5,
        totalCorrect: Object.values(growth.awarded).filter(entry => entry.amount === 1).length,
        remainingToMax: ANALYSIS_REQUIREMENTS.slice(level, 5).reduce((a, b) => a + b, 0) - current };
}

function ownedEvent(engine, itemId) {
    const item = engine.state.inventory.find(entry => entry.id === itemId && entry.quantity > 0);
    const canonical = events.get(item?.rumorId);
    if (!item?.isRead || !isAuthoredRumor(item) || !canonical || item.targetStockId !== canonical.targetStockId) return null;
    return { item, canonical };
}

export function beginInterpretationQuiz(engine, itemId) {
    const owned = ownedEvent(engine, itemId);
    if (!owned) return fail('먼저 회사별 5단계 찌라시를 열람해 주세요. 이전 원고는 읽기만 유지돼요.');
    const { item, canonical } = owned;
    const growth = initializeAnalysisGrowth(engine.state);
    const level = rumorLevel(item, engine.stats().analysis);
    const text = canonical.rumorStages[level - 1];
    const question = buildInterpretationQuestion(item.rumorId, level, text);
    if (!question) return fail('현재 본문에 맞는 문제를 불러오지 못했어요. 찌라시를 다시 열어 주세요.');
    let session = growth.quizzes[item.rumorId];
    if (!session || session.key !== question.key) {
        session = { key: question.key, level, text, attempts: 0, completed: false };
        growth.quizzes[item.rumorId] = session;
    }
    // Never send the correct index or unexposed event metadata to the View.
    const { correctIndex, evidence, explanation, ...visible } = question;
    return { success: true, ...visible, text, completed: session.completed,
        awarded: !!growth.awarded[item.rumorId], progress: analysisProgress(engine.state),
        ...(growth.awarded[item.rumorId]?.outcome === 'incorrect'
            ? { resolution: wrongResolution(question, engine.state) } : {}) };
}

export function submitInterpretationQuiz(engine, itemId, questionKey, choiceIndex) {
    const owned = ownedEvent(engine, itemId);
    if (!owned) return fail('보유한 찌라시를 다시 열어 주세요.');
    const growth = initializeAnalysisGrowth(engine.state);
    const eventId = owned.item.rumorId;
    const session = growth.quizzes[eventId];
    if (!session || session.key !== questionKey) return fail('문제가 바뀌었어요. 현재 찌라시에서 다시 확인해 주세요.');
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex > 2) return fail('답 하나를 선택해 주세요.');
    const question = buildInterpretationQuestion(eventId, session.level, session.text);
    // Reopen old generated-question sessions without resetting the reward ledger.
    if (!question || question.key !== session.key) return fail('문제가 갱신됐어요. 현재 찌라시에서 다시 확인해 주세요.');
    if (growth.awarded[eventId]?.outcome === 'incorrect') return wrongResolution(question, engine.state);
    session.attempts++;
    if (choiceIndex !== question.correctIndex) {
        session.completed = true;
        growth.awarded[eventId] ??= { at: engine.now(), amount: 0, outcome: 'incorrect' };
        return wrongResolution(question, engine.state);
    }
    session.completed = true;
    if (growth.awarded[eventId]) return {
        success: true, correct: true, amount: 0, message: '맞아요. 이 사건은 이미 확인했으므로 추가 보상은 없어요.',
        explanation: question.explanation, progress: analysisProgress(engine.state)
    };
    const before = clampAnalysis(growth.level);
    const amount = before < 5 ? 1 : 0;
    // Claim ledger and proficiency are committed together in the same saved item state.
    growth.awarded[eventId] = { at: engine.now(), amount };
    growth.proficiency += amount;
    while (growth.level < 5 && growth.proficiency >= ANALYSIS_REQUIREMENTS[growth.level]) {
        growth.proficiency -= ANALYSIS_REQUIREMENTS[growth.level];
        growth.level++;
    }
    if (growth.level >= 5) growth.proficiency = 0;
    return { success: true, correct: true, amount, promoted: growth.level > before,
        message: amount ? (growth.level > before ? `정답! 숙련도 +1 · 분석력 Lv.${growth.level}로 성장했어요.` : '정답! 분석력 숙련도 +1을 얻었어요.')
            : '정답! 분석력은 최대 Lv.5예요. 보상 없이 해설을 다시 볼 수 있어요.',
        explanation: question.explanation, progress: analysisProgress(engine.state) };
}
