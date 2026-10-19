import { SideQuestList } from './SideQuestList.js';

export class RentQuestTracker {
    constructor(container, { onClaimQuest = () => {} } = {}) {
        this.element = document.createElement('aside');
        this.element.className = 'rent-quest';
        this.element.hidden = true;
        this.element.setAttribute('aria-label', '진행 중인 퀘스트');
        this.element.innerHTML = `
            <div class="rent-quest-heading"><span>MAIN QUEST</span><div class="rent-quest-heading-actions"><span data-deadline></span><button type="button" class="rent-quest-toggle" aria-controls="rentQuestDetails" aria-expanded="true" aria-label="퀘스트 접기" title="퀘스트 접기"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true"><path d="m5 12 5-5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>
            <h2>첫 월세 준비하기</h2>
            <div id="rentQuestDetails" class="rent-quest-details"><p class="rent-quest-objective" data-objective></p>
            <div class="rent-quest-amount"><strong data-amount></strong><span data-target></span></div>
            <progress max="100" value="0" aria-label="월세 준비 진행률"></progress>
            <p class="rent-quest-status" data-status role="status"></p>
            <p class="rent-quest-tip">월세는 보유 현금에서 차감돼요.<br>정산 전까지 현금 5,000G를 준비하세요.</p></div>`;
        container.appendChild(this.element);
        this.fields = Object.fromEntries(['deadline', 'objective', 'amount', 'target', 'status'].map(key =>
            [key, this.element.querySelector(`[data-${key}]`)]));
        this.progress = this.element.querySelector('progress');
        this.details = this.element.querySelector('.rent-quest-details');
        this.toggleButton = this.element.querySelector('.rent-quest-toggle');
        this.mainPanel = document.createElement('div');
        this.mainPanel.append(...this.details.childNodes);
        this.tabs = document.createElement('nav');
        this.tabs.className = 'quest-tabs';
        this.tabs.setAttribute('aria-label', '퀘스트 종류');
        this.tabs.innerHTML = '<button type="button" data-tab="side">서브 퀘스트</button><button type="button" data-tab="main">월세 목표</button>';
        this.details.append(this.tabs, this.mainPanel);
        this.sideQuests = new SideQuestList(this.details, onClaimQuest);
        this.tabs.addEventListener('click', event => {
            const tab = event.target.closest('[data-tab]');
            if (tab) this.setTab(tab.dataset.tab);
        });
        this.tabs.addEventListener('keydown', event => event.stopPropagation());
        this.setTab('side');
        this.collapsed = false;
        try { this.collapsed = globalThis.localStorage?.getItem('stockwars.quest.collapsed') === 'true'; } catch {}
        this.setCollapsed(this.collapsed);
        this.toggleButton.addEventListener('click', () => {
            this.setCollapsed(!this.collapsed);
            try { globalThis.localStorage?.setItem('stockwars.quest.collapsed', String(this.collapsed)); } catch {}
        });
        this.toggleButton.addEventListener('keydown', e => e.stopPropagation());
    }

    setTab(tab) {
        this.activeTab = tab;
        this.mainPanel.hidden = tab !== 'main';
        this.sideQuests.element.hidden = tab !== 'side';
        this.fields.deadline.hidden = tab !== 'main';
        this.element.querySelector('h2').textContent = tab === 'main' ? '첫 월세 준비하기' : '도전 과제';
        this.element.querySelector('.rent-quest-heading > span').textContent = tab === 'main' ? 'MAIN QUEST' : 'SIDE QUEST';
        this.tabs.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === tab)));
    }

    setCollapsed(collapsed) {
        this.collapsed = collapsed;
        this.details.hidden = collapsed;
        this.element.classList.toggle('is-collapsed', collapsed);
        this.toggleButton.setAttribute('aria-expanded', String(!collapsed));
        const label = collapsed ? '퀘스트 펼치기' : '퀘스트 접기';
        this.toggleButton.setAttribute('aria-label', label);
        this.toggleButton.title = label;
    }

    update(state, visible, quests = []) {
        this.element.hidden = !visible;
        if (!visible) return;
        this.tabs.querySelector('[data-tab=side]').hidden = quests.length === 0;
        if (!quests.length && this.activeTab === 'side') this.setTab('main');
        this.sideQuests.update(quests);
        const amount = Math.max(0, Math.floor(state.cash));
        const target = state.targetRent;
        const remaining = Math.max(0, target - amount);
        const paid = !!state.rentSettlement;
        const ready = paid || remaining === 0;
        const due = state.day >= state.maxDays;
        this.element.classList.toggle('is-ready', ready);
        this.fields.deadline.textContent = due ? '정산일' : `D-${state.maxDays - state.day}`;
        this.fields.objective.textContent = `${state.maxDays}일 차까지 월세 ${target.toLocaleString()}G 준비`;
        this.fields.amount.textContent = `${amount.toLocaleString()} G`;
        this.fields.target.textContent = `/ ${target.toLocaleString()} G`;
        this.progress.value = paid ? 100 : Math.min(100, amount / target * 100);
        this.fields.status.textContent = paid ? '✓ 월세 납부 완료' : ready
            ? (due ? '✓ 정산 목표 달성' : '✓ 월세 확보 · 정산일까지 유지하세요')
            : `${remaining.toLocaleString()}G 더 모으면 ${due ? '정산 목표 달성' : '월세 확보'}`;
    }
}
