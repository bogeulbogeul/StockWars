import { RUMOR_CLUES } from '../data/rumorClues.js';
import { isAuthoredRumor, rumorLevel } from './RumorInterpretation.js';

function legacyDecryption(text, item, analysis) {
    const level = Math.min(5, Math.max(1, Math.floor(Number(analysis) || 1), Number(item.interpretationLevel) || 1));
    const noise = [80, 60, 40, 15, 0][level - 1];
    let content = String(text);
    if (level < 5) {
        content = item.rumorClues?.[level - 1] || RUMOR_CLUES[item.targetStockId]?.[level - 1];
        // Unknown rumors keep their own event; never borrow another company's clue.
        if (!content) {
            content = String(text);
            for (const name of [item.targetStockName, item.targetStockId].filter(Boolean)) content = content.replaceAll(name, level >= 4 ? name : '그 업체');
            if (level < 4) content = content.replace(/[+\-]?\d+(?:\.\d+)?\s*(?:%|조\s*원|만\s*명|G)/g, '꽤 큰 규모');
            content = `익명 제보야. ${content}\n${level < 3 ? '말이 부풀었을 수도 있어. 이름보다 사건의 단서를 먼저 맞춰봐.' : '사건과 발표 시점을 함께 확인해 봐.'}`;
        }
    }
    return { level, noise, text: content };
}

export function rumorDecryption(text, item, analysis) {
    if (!isAuthoredRumor(item)) return { ...legacyDecryption(text, item, analysis), maxLevel: 5, legacy: true };
    const level = rumorLevel(item, analysis);
    return { level, maxLevel: 5, noise: 0, text: item.rumorStages[level - 1], legacy: false };
}
