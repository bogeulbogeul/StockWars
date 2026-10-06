import { LogisticsAudio } from './logistics/LogisticsAudio.js';

export class LevelUpNotice {
    constructor(container) {
        this.element = document.createElement('div');
        this.element.className = 'level-up-notice';
        this.element.setAttribute('popover', 'manual');
        this.element.setAttribute('role', 'status');
        this.element.setAttribute('aria-live', 'polite');
        this.element.innerHTML = '<div class="level-up-burst" aria-hidden="true">✦</div><div class="level-up-card"><span class="level-up-heading">LEVEL UP!</span><h2>레벨 업!</h2><p class="level-up-number"></p><p>트레이더로서 한 단계 성장했습니다!</p><button type="button" aria-label="레벨업 알림 닫기">확인</button></div>';
        container.append(this.element);
        this.element.querySelector('button').addEventListener('click', () => this.close());
        this.audio = new LogisticsAudio();
    }
    show(previous, current) {
        clearTimeout(this.timer);
        this.element.querySelector('.level-up-number').textContent = `Lv. ${previous} → Lv. ${current}`;
        this.element.hidePopover();
        this.element.showPopover();
        this.audio.playWin();
        this.timer = setTimeout(() => this.close(), 8000);
    }
    close() { clearTimeout(this.timer); this.element.hidePopover(); }
}
