import { LogisticsAudio } from './logistics/LogisticsAudio.js';

const abilities = {
    analysis: ['분석력', '찌라시에서 더 자세한 정보를 읽어내는 능력입니다. 분석 단계가 높아질수록 기업과 사건의 단서가 구체적으로 드러납니다.'],
    negotiation: ['협상력', '단계마다 거래 수수료 0.01%p 감면, 물류 보상 5% 가산이 적용됩니다. 협상가 성향은 수수료 추가 30% 할인입니다. 대출 기능은 준비 중입니다.'],
    management: ['운용력', '종목 슬롯은 기본 5칸이며 운용력 단계마다 5칸 늘어납니다. 종목별 투자 한도도 단계에 따라 증가합니다. 공격적 자산가는 슬롯 2칸을 추가로 받습니다.'],
    recovery: ['회복력', '더 오래 활동하기 위한 능력입니다. 현재 적용 수치가 2 이상이면 최대 체력 4칸, 4 이상이면 5칸이 됩니다. 시간에 따른 자연 회복은 없어요. 기본 회복력은 물류 조작·파손·이동을 보정하며, 5단계는 10% 확률로 노동 체력 소모를 면제합니다.']
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
