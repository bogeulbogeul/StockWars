import { AUTHORED_RUMOR_QUIZZES } from '../data/authoredRumorQuizzes.js';
import { AUTHORED_RUMORS } from '../data/authoredRumors.js';

const questions = new Map();
const events = new Map(AUTHORED_RUMORS.map(event => [event.rumorId, event]));
for (const entry of AUTHORED_RUMOR_QUIZZES) {
    if (!questions.has(entry.eventId)) questions.set(entry.eventId, new Map());
    questions.get(entry.eventId).set(entry.minLevel, entry);
}
function hash(text) {
    let value = 2166136261;
    for (const letter of text) value = Math.imul(value ^ letter.charCodeAt(0), 16777619);
    return value >>> 0;
}
export function buildInterpretationQuestion(eventId, level, text) {
    if (!Number.isInteger(level) || level < 1 || level > 5 || typeof text !== 'string') return null;
    const minLevel = level;
    const entry = questions.get(eventId)?.get(minLevel);
    const event = events.get(eventId);
    // Stage 2/3 paraphrases stage 1 instead of appending it. Only accept canonical text.
    if (!entry || !event || text !== event.rumorStages[level - 1]
        || !event.rumorStages[minLevel - 1].includes(entry.evidence)) return null;
    const key = ['authored-five-v2', eventId, level, hash(JSON.stringify([entry, text]))].join(':');
    return { key, level, question: entry.question, choices: [...entry.choices],
        correctIndex: entry.correctIndex, evidence: text.includes(entry.evidence) ? entry.evidence : text,
        explanation: entry.explanation };
}
