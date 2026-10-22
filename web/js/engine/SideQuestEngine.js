// Retired 2026-10-22. Inert compatibility boundary for old callers.
// Never normalize or modify historical quest/title records in a save.
const retired = () => ({ success: false, message: '종료된 기능입니다.' });
export class SideQuestEngine {
    list() { return []; }
    active() { return []; }
    offers() { return []; }
    accept() { return retired(); }
    record() { return false; }
    claim() { return retired(); }
    ownsTitle() { return false; }
    titleCollection() { return []; }
    equippedTitle() { return null; }
    equipTitle() { return retired(); }
}
