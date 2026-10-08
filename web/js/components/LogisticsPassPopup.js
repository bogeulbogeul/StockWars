import { ITEM_BALANCE } from '../engine/ItemEngine.js';

export function passRemaining(until, now) {
    const minutes = Math.max(0, Math.ceil((until - now) / 60000));
    if (!minutes) return '만료';
    const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60);
    return `${days ? `${days}일 ` : ''}${hours ? `${hours}시간 ` : ''}${minutes % 60}분`;
}

export class LogisticsPassPopup {
    constructor(engine) {
        this.engine = engine;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'item-center item-stat-popup';
        this.dialog.setAttribute('aria-label', '비트물류 퀵패스');
        this.dialog.innerHTML = '<header><h2>비트물류 퀵패스</h2></header><p data-pass-status role="status"></p><p data-pass-details></p><div><button data-quick>패스로 즉시 완료</button><button data-manual>직접 작업</button><button data-close>확인</button></div>';
        document.body.appendChild(this.dialog);
        this.dialog.addEventListener('keydown', event => event.stopPropagation());
        this.dialog.querySelector('[data-close]').onclick = () => this.close();
    }
    render() {
        const e = this.engine;
        const active = e.state.passUntil > e.now();
        this.dialog.querySelector('[data-pass-status]').textContent = active ? `패스 적용 중 · 남은 시간 ${passRemaining(e.state.passUntil, e.now())}` : '패스가 만료되었습니다.';
        this.dialog.querySelector('[data-pass-details]').textContent = `즉시 완료 보상 ${ITEM_BALANCE.quickGold.toLocaleString()}G · ${ITEM_BALANCE.quickExp} EXP · 수수료 0%\n작업마다 체력 ${e.laborCost()}칸 소모 · 현재 ${e.state.stamina}/${e.maxStamina()}칸`;
        this.dialog.querySelector('[data-quick]').disabled = !active || e.state.stamina < e.laborCost();
    }
    open({ onQuick, onManual } = {}) {
        this.render();
        const choice = Boolean(onQuick && onManual);
        this.dialog.querySelector('[data-quick]').hidden = !choice;
        this.dialog.querySelector('[data-manual]').hidden = !choice;
        this.dialog.querySelector('[data-close]').textContent = choice ? '닫기' : '확인';
        this.dialog.querySelector('[data-quick]').onclick = () => { this.close(); onQuick(); };
        this.dialog.querySelector('[data-manual]').onclick = () => { this.close(); onManual(); };
        if (!this.dialog.open) this.dialog.showModal();
    }
    showResult(result) {
        if (!result.success || !result.logisticsPass) return false;
        this.open();
        return true;
    }
    close() { this.dialog.close(); }
}
