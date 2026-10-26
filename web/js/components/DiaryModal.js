import { saveDiary } from '../app/DiarySave.js';
import { DiaryBook } from './DiaryBook.js';
export class DiaryModal {
    constructor(app) { this.app = app; this.book = new DiaryBook(); this.dialog = this.book.dialog; }
    open() {
        if (this.app.demoEnded) return;
        const owned = this.app.userProfile?.diaryReceived;
        this.book.open({ canWrite: false, extras: owned ? [
            ['저장하기', status => this.save(false, status)],
            ['저장하고 종료하기', status => this.save(true, status)]
        ] : [] });
        if (!owned) this.book.status.textContent = '모아에게 다이어리를 받은 뒤 사용할 수 있어요.';
    }
    async save(quit, status) {
        if (this.saving) return;
        this.saving = true;
        try { const result = await saveDiary(this.app, quit); status.textContent = result.error || result.message || '저장했어요.'; }
        catch { status.textContent = '저장하지 못했어요. 다시 시도해 주세요.'; }
        finally { this.saving = false; }
    }
}
