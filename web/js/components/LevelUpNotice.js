import { LogisticsAudio } from './logistics/LogisticsAudio.js';

const abilities = {
    analysis: ['분석력', '찌라시에서 더 자세한 정보를 읽어내는 능력입니다. 분석 단계가 높아질수록 기업과 사건의 단서가 구체적으로 드러납니다.'],
    negotiation: ['협상력', '거래와 금융 협상을 위한 능력입니다. 수수료·이율·알바 보상 보정은 추후 적용될 예정입니다.'],
    management: ['운용력', '보유 종목과 투자 규모를 관리하는 능력입니다. 기본 운용력에 따른 종목 슬롯·매수 한도 확장은 추후 적용될 예정입니다.'],
    recovery: ['회복력', '더 오래 활동하기 위한 능력입니다. 현재 적용 수치가 2 이상이면 최대 체력 4칸, 4 이상이면 5칸이 됩니다.']
};

export class LevelUpNotice {
    constructor(container, { getState, onConfirm }) {
        this.getState = getState;
        this.onConfirm = onConfirm;
        this.element = document.createElement('dialog');
        this.element.className = 'level-up-notice';
        this.element.setAttribute('aria-labelledby', 'levelUpTitle');
        this.element.innerHTML = `<div class="level-up-card"><span class="level-up-heading">LEVEL UP!</span><h2 id="levelUpTitle">능력치 성장</h2><p class="level-up-number"></p><p class="level-up-points"></p><div class="level-up-choices" role="group" aria-label="올릴 능력치 선택">${Object.entries(abilities).map(([key, [name]]) => `<button type="button" data-stat="${key}" aria-pressed="false">${name}<span></span></button>`).join('')}</div><div class="level-up-description" aria-live="polite"></div><button class="level-up-confirm" type="button" disabled>능력치를 선택해 주세요</button></div>`;
        container.append(this.element);
        this.element.addEventListener('cancel', event => event.preventDefault());
        this.element.addEventListener('keydown', event => event.stopPropagation());
        this.element.querySelectorAll('[data-stat]').forEach(button => button.addEventListener('click', () => {
            this.selected = button.dataset.stat;
            this.render();
        }));
        this.element.querySelector('.level-up-confirm').addEventListener('click', () => {
            if (!this.selected) return;
            const result = this.onConfirm(this.selected);
            if (!result.success) {
                this.element.querySelector('.level-up-description').textContent = result.message;
                return;
            }
            this.selected = null;
            if (this.getState().points > 0) {
                this.render();
                this.element.querySelector('[data-stat]').focus();
            } else this.close();
        });
        this.audio = new LogisticsAudio();
    }
    render() {
        const { level, points, stats } = this.getState();
        this.element.querySelector('.level-up-number').textContent = `Lv. ${level}`;
        this.element.querySelector('.level-up-points').textContent = `능력치 하나를 1 올릴 수 있습니다 · 남은 포인트 ${points}`;
        this.element.querySelectorAll('[data-stat]').forEach(button => {
            const key = button.dataset.stat;
            button.setAttribute('aria-pressed', String(key === this.selected));
            button.querySelector('span').textContent = `${stats[key]} → ${stats[key] + 1}`;
        });
        this.element.querySelector('.level-up-description').textContent = this.selected ? abilities[this.selected][1] : '성장시킬 능력치를 선택하면 여기에 설명이 표시됩니다.';
        const confirm = this.element.querySelector('.level-up-confirm');
        confirm.disabled = !this.selected || points < 1;
        confirm.textContent = this.selected ? `${abilities[this.selected][0]} +1 확인` : '능력치를 선택해 주세요';
    }
    show() {
        if (this.element.open || this.getState().points < 1) return;
        this.selected = null;
        this.render();
        this.element.showModal();
        this.audio.playWin();
    }
    close() { this.selected = null; this.element.close(); }
}
