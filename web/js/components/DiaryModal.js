import { saveDiary } from '../app/DiarySave.js';

export class DiaryModal {
    constructor(app) {
        this.app = app;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'diary-dialog';
        this.dialog.setAttribute('aria-labelledby', 'diary-title');
        this.dialog.innerHTML = `<h2 id="diary-title">소망이의 일기장</h2>
            <p>모아가 건네준 일기장에 오늘의 발자취를 남겨요.</p>
            <p>플레이 중에는 자동으로 저장돼요. 쉬러 가기 전에도 여기서 저장할 수 있어요.</p>
            <p data-diary-status role="status" aria-live="polite"></p>
            <div class="diary-actions"><button data-diary-save>저장하기</button>
            <button data-diary-quit>저장하고 종료하기</button><button data-diary-close>계속하기</button></div>`;
        document.body.append(this.dialog);
        this.status = this.dialog.querySelector('[data-diary-status]');
        this.dialog.querySelector('[data-diary-save]').onclick = () => void this.save(false);
        this.dialog.querySelector('[data-diary-quit]').onclick = () => void this.save(true);
        this.dialog.querySelector('[data-diary-close]').onclick = () => this.dialog.close();
    }
    open() {
        if (this.app.demoEnded) return;
        const owned = this.app.userProfile?.diaryReceived;
        this.status.textContent = !owned ? '모아가 정착 지원금과 함께 일기장을 건네줄 거예요.'
            : this.app.userProfile.diarySavedAt ? `마지막 일기장 저장: ${new Date(this.app.userProfile.diarySavedAt).toLocaleString('ko-KR')}`
            : '오늘의 발자취를 저장해 볼까요?';
        this.dialog.querySelectorAll('[data-diary-save], [data-diary-quit]').forEach(b => b.disabled = !owned);
        if (!this.dialog.open) this.dialog.showModal();
    }
    async save(quit) {
        const buttons = this.dialog.querySelectorAll('button');
        buttons.forEach(b => b.disabled = true);
        try {
            const result = await saveDiary(this.app, quit);
            this.status.textContent = result.error || result.message || '저장했어요. 다음에 다시 만나요.';
        } catch { this.status.textContent = '종료하지 못했어요. 다시 시도해 주세요.'; }
        finally { buttons.forEach(b => b.disabled = false); }
    }
}
