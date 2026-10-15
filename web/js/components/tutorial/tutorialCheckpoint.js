export const tutorialChapters = [
    ['welcome_1', '환영 인사'],
    ['open_phone', '스마트폰과 첫 매수'],
    ['celebrate', '내 계좌와 뉴스 확인'],
    ['go_town_proposal', '타운 외출과 물류 실습'],
    ['rumor_inventory_guide', '찌라시 읽는 방법'],
    ['stamina_recovery_guide', '체력 회복'],
    ['stock_basics_budget', '생활비 준비와 자립']
];

export function tutorialCheckpoint(steps, index) {
    return tutorialChapters.filter(([id]) => {
        const position = steps.findIndex(step => step.id === id);
        return position >= 0 && position <= index;
    }).at(-1)?.[0];
}

// Return the next available chapter; missing chapters in short follow-up lessons are ignored.
export function nextTutorialChapter(steps, index, resumeCheckpoint) {
    const current = steps[index]?.id === 'tutorial_resume'
        ? Math.max(0, steps.findIndex(step => step.id === resumeCheckpoint)) : index;
    return tutorialChapters.map(([id, name]) => ({ id, name, index: steps.findIndex(step => step.id === id) }))
        .find(chapter => chapter.index > current) || null;
}
