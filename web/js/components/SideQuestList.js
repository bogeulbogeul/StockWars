const giverName = giver => ({anna:'안나',park:'박씨 아저씨',agent_k:'에이전트 K'}[giver] || '의뢰인');
import { titleName } from '../data/playerTitles.js';

export class SideQuestList {
    constructor(container, onClaim) {
        this.element = document.createElement('section');
        this.element.className = 'side-quest-list';
        container.append(this.element);
        this.element.addEventListener('keydown', event => event.stopPropagation());
        this.element.addEventListener('click', event => {
            const button = event.target.closest('[data-quest-claim]');
            if (button) onClaim(button.dataset.questClaim);
        });
    }
    update(quests) {
        const signature = JSON.stringify(quests);
        if (signature === this.signature) return;
        this.signature = signature;
        const opened = new Set([...this.element.querySelectorAll('details[open]')].map(el => el.dataset.quest));
        const first = !this.element.children.length;
        this.element.innerHTML = quests.map((quest, i) => `
            <details data-quest="${quest.id}" ${opened.has(quest.id) || (first && i === 0) ? 'open' : ''}>
                <summary>${quest.title}<span>${quest.claimed ? '완료' : quest.ready ? `${giverName(quest.giver)}에게 돌아가기` : `${quest.count.toLocaleString()}/${quest.target.toLocaleString()}${quest.unit || ''}`}</span></summary>
                <p>${quest.description}</p>
                <progress max="${quest.target}" value="${quest.count}" aria-label="${quest.title} 진행률"></progress>
                <p class="side-quest-reward">보상 ${quest.gold}G · ${quest.exp} EXP · 칭호 [${titleName(quest.id)}]</p>
                ${quest.claimed ? '<p class="side-quest-done">보상을 받았어요.</p>' : quest.ready ? `<p class="side-quest-done">${giverName(quest.giver)}에게 말을 걸어 보상을 받으세요.</p>` : ''}
            </details>`).join('');
    }
}
