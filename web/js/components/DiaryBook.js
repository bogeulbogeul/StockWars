export const FIRST_DIARY_LINES = ['포포리에 왔다.', '내 이름을 정했다.', '처음으로 일을 하고, 주식도 샀다.', '가지고 온 씨앗을 화분에 심었다.', '그리고…… 꿀 쿠키가 맛있었다.'];
export class DiaryBook {
    constructor() {
        this.dialog = document.createElement('dialog'); this.dialog.className = 'diary-book';
        this.dialog.setAttribute('aria-label', '오늘의 다이어리');
        this.dialog.innerHTML = `<button class="diary-book__close" aria-label="다이어리 닫기">×</button><article class="diary-book__page"><small>나의 다이어리 · 첫째 날</small><h2>포포리에 온 날</h2><div class="diary-book__lines" data-left></div></article><article class="diary-book__page"><div class="diary-book__lines" data-right></div><footer><p data-status role="status" aria-live="polite"></p><button data-write>오늘의 기록 남기기</button><div class="diary-book__extras"></div><small class="diary-book__number">1</small></footer></article>`;
        document.body.append(this.dialog);
        this.left = this.dialog.querySelector('[data-left]'); this.right = this.dialog.querySelector('[data-right]');
        const advance = event => {
            if (event.type === 'keydown' && (!['Enter',' '].includes(event.key) || event.repeat)) return;
            event.preventDefault(); event.stopPropagation();
            if (this.writing) this.finishWriting(); else if (this.finished) this.dialog.close();
        };
        for (const lines of [this.left, this.right]) {
            lines.setAttribute('role', 'button'); lines.tabIndex = 0; lines.style.cursor = 'pointer';
            lines.addEventListener('click', advance); lines.addEventListener('keydown', advance);
        }
        this.status = this.dialog.querySelector('[data-status]'); this.button = this.dialog.querySelector('[data-write]');
        this.dialog.querySelector('.diary-book__close').onclick = () => this.dialog.close();
        this.dialog.addEventListener('close', () => { clearTimeout(this.timer); this.onClose?.(this.finished); });
        this.dialog.addEventListener('keydown', e => {
            if (e.key === 'Escape') { e.preventDefault(); this.dialog.close(); }
            e.stopPropagation();
        });
    }
    open({ written = false, canWrite = true, onComplete, onClose, extras = [] } = {}) {
        if (this.dialog.open) return;
        clearTimeout(this.timer); this.writing = false; this.finished = written; this.onClose = onClose;
        this.onComplete = onComplete; this.canWrite = canWrite;
        this.left.replaceChildren(); this.right.replaceChildren();
        this.paragraphs = FIRST_DIARY_LINES.map((line, i) => {
            const p = document.createElement('p'); p.textContent = written ? line : '';
            (i < 3 ? this.left : this.right).append(p); return p;
        });
        this.status.textContent = written ? '내일은 무슨 일이 있을까?' : canWrite ? '오늘의 마음을 한 줄씩 남겨요.' : '아직 첫 기록을 남기기 전이에요.';
        this.button.textContent = written || !canWrite ? '다이어리 덮기' : '오늘의 기록 남기기'; this.button.disabled = false;
        this.button.onclick = () => this.writing ? this.finishWriting() : this.finished || !this.canWrite ? this.dialog.close() : this.write();
        const extra = this.dialog.querySelector('.diary-book__extras'); extra.replaceChildren();
        for (const [label, action] of extras) { const b = document.createElement('button'); b.textContent = label; b.onclick = () => action(this.status); extra.append(b); }
        this.dialog.showModal();
    }
    finishWriting() {
        if (this.finished) return;
        clearTimeout(this.timer); this.writing = false; this.finished = true;
        this.paragraphs.forEach((p, i) => { p.textContent = FIRST_DIARY_LINES[i]; p.classList.remove('is-writing'); });
        this.onComplete?.(); this.status.textContent = '내일은 무슨 일이 있을까?';
        this.button.textContent = '다이어리 덮기'; this.button.disabled = false;
    }
    write() {
        if (this.writing || this.finished) return;
        this.writing = true; this.button.disabled = false; this.button.textContent = '기록 마치기'; this.status.textContent = '오늘을 적고 있어요…';
        let line = 0, char = 0;
        const tick = () => {
            if (!this.dialog.open) return;
            this.paragraphs.forEach(p => p.classList.remove('is-writing'));
            if (line === FIRST_DIARY_LINES.length) {
                this.finishWriting(); return;
            }
            const p = this.paragraphs[line]; p.classList.add('is-writing'); p.textContent = FIRST_DIARY_LINES[line].slice(0, ++char);
            if (char >= FIRST_DIARY_LINES[line].length) { line++; char = 0; }
            this.timer = setTimeout(tick, char === 0 ? 300 : 45);
        }; tick();
    }
}
