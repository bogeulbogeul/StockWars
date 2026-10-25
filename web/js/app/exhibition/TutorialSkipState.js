import { complete } from './State.js';

export function tutorialStage(beat) {
    if (!beat) return null;
    const { place, chapter, id } = beat;
    if (place === 'arrival' || id === 'walk') return ['arrival', '정류장 만남'];
    if (chapter === 19 || id === 'pot') return ['pot', '화분 준비'];
    if (chapter === 20 || place === 'home' && ['planted', 'diaryWritten', 'asleep'].includes(id)) return ['ending', '집에서 마무리'];
    if (chapter === 17 || chapter === 18 || ['grant', 'diary'].includes(id)) return ['support', '정착 지원 안내'];
    if (chapter === 16 || ['sunset', 'cookie'].includes(id)) return ['reunion', '모아와 마지막 만남'];
    if (place === 'stock' || chapter === 15) return ['stock', '주식 배우기'];
    if (place === 'notice' || chapter === 11 || chapter === 12 || place === 'store' || id === 'rumor') return ['packing', '잡화점 알바'];
    if (place === 'bank' || place === 'bankOutside') return ['bank', '은행 안내'];
    if (place === 'home') return ['home', '집 둘러보기'];
    if (place === 'information' || beat.mapIntro) return ['information', '안내소 등록'];
    return ['travel', '이동 안내'];
}

export function skipStageRange(plan, cursor) {
    const stage = tutorialStage(plan[cursor]);
    if (!stage) return null;
    let start = cursor, end = cursor + 1;
    while (start > 0 && tutorialStage(plan[start - 1])?.[0] === stage[0]) start--;
    while (end < plan.length && tutorialStage(plan[end])?.[0] === stage[0]) end++;
    return { start, end, id: stage[0], label: stage[1] };
}

// Skip learning, never fabricate a stock purchase or quiz answers. Other
// mandatory receipts use the same idempotent completion rules as normal play.
export function applyTutorialSkip(state, plan, range) {
    for (const beat of plan.slice(range.start, range.end)) {
        if (beat.kind !== 'action' || state.flags[beat.id]) continue;
        const id = beat.id === 'moaFarewell' ? 'phoneReady' : beat.id;
        if (id === 'asleep') continue;
        if (id === 'nickname') state.nickname ||= '소망이';
        if (id === 'certificate' || id === 'trade') state.flags[id] = true;
        else if (!state.flags[id] && !complete(state, id)) throw new Error(`단계를 건너뛸 준비가 되지 않았어요: ${id}`);
    }
    state.skippedTutorialStages ??= [];
    if (!state.skippedTutorialStages.includes(range.id)) state.skippedTutorialStages.push(range.id);
    state.cursor = Math.min(range.end, plan.length - 1);
    if (range.id === 'arrival') { state.flags.moaAwake = true; state.moaCalls = 3; }
}
