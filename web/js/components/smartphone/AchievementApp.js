import { PLAYER_TITLES as TITLE_REWARDS, titleName, titleLanguage } from '../../data/playerTitles.js';
import { createTitleBadge } from '../TitleBadge.js';

export class AchievementApp {
    constructor(element, onHome) {
        this.element = element;
        this.filter = 'all';
        this.quests = [];
        element.innerHTML = `
            <header class="achieve-header"><button type="button" data-achieve-home aria-label="스마트폰 홈으로">←</button><div><span>MY COLLECTION</span><h2>칭호 도감</h2></div><span class="achieve-header-symbol" aria-hidden="true">✦</span></header>
            <div class="achieve-scroll">
                <section class="achieve-summary"><div class="achieve-total" aria-live="polite"></div><progress class="achieve-overall" aria-label="전체 칭호 수집률" max="5" value="0"></progress></section>
                <div class="achieve-section-heading"><h3>칭호 도감</h3><div class="achieve-filters" role="group" aria-label="칭호 필터"><button type="button" data-achieve-filter="all" aria-pressed="true">전체</button><button type="button" data-achieve-filter="earned" aria-pressed="false">획득</button></div></div>
                <p class="achieve-help">획득한 칭호의 [장착]을 눌러 변경할 수 있어요. 칭호를 바꿔도 시작 능력은 유지돼요. 미획득 칭호는 ?로 표시돼요.</p>
                <div class="achieve-list"></div>
            </div>`;
        element.addEventListener('click', event => {
            if (event.target.closest('[data-achieve-home]')) onHome();
            const equip = event.target.closest('[data-title-equip]');
            if (equip) {
                // Rendering removes the clicked node; do not let the phone's outside-click handler treat it as outside.
                event.stopPropagation();
                this.onEquipTitle?.(equip.dataset.titleEquip === this.equippedTitle ? null : equip.dataset.titleEquip);
            }
            const filter = event.target.closest('[data-achieve-filter]');
            if (!filter) return;
            this.filter = filter.dataset.achieveFilter;
            element.querySelectorAll('[data-achieve-filter]').forEach(button => button.setAttribute('aria-pressed', String(button === filter)));
            this.renderList();
        });
        this.update([]);
    }

    update(quests, equippedTitle = null) {
        const signature = JSON.stringify([quests, equippedTitle, titleLanguage()]);
        if (signature === this.signature) return;
        this.signature = signature;
        this.equippedTitle = equippedTitle;
        this.quests = quests.filter(quest => TITLE_REWARDS[quest.id]);
        const count = this.quests.filter(quest => quest.claimed).length;
        this.element.querySelector('.achieve-total').innerHTML = `<strong>${count}<small> / ${Object.keys(TITLE_REWARDS).length}</small></strong><span>획득한 칭호</span>`;
        this.element.querySelector('.achieve-overall').max = Object.keys(TITLE_REWARDS).length;
        this.element.querySelector('.achieve-overall').value = count;
        this.renderList();
    }

    renderList() {
        const list = this.element.querySelector('.achieve-list');
        list.replaceChildren();
        const visible = this.quests.filter(quest => this.filter !== 'earned' || quest.claimed);
        if (!visible.length) {
            const empty = document.createElement('p');
            empty.className = 'achieve-empty';
            empty.textContent = '아직 획득한 칭호가 없어요. 첫 번째 도전에 도전해 보세요!';
            list.append(empty);
        }
        for (const quest of visible) {
            const title = titleName(quest.id), symbol = '?', color = '';
            const earned = quest.claimed;
            const card = document.createElement('article');
            card.className = `achieve-card ${earned ? 'is-earned' : ''}`;
            const index = this.quests.indexOf(quest) + 1;
            card.innerHTML = `<div class="achieve-card-top"><span>No. ${String(index).padStart(2, '0')}</span><span class="achieve-state">${earned ? '✓ 획득' : '미획득'}</span></div><div class="achieve-emblem ${color}" aria-hidden="true">${earned ? symbol : '?'}</div><h4 class="achieve-title"></h4><span class="achieve-category">${quest.event === 'trade' ? '투자' : quest.event === 'labor' ? '노동' : '경쟁'}</span><p class="achieve-condition"></p><div class="achieve-progress-row"><span></span><progress></progress></div>`;
            card.querySelector('.achieve-title').textContent = earned ? title : '???';
            if (quest.event === 'trait') card.querySelector('.achieve-category').textContent = titleLanguage() === 'en' ? 'Starting Trait' : '시작 성향';
            if (earned) card.querySelector('.achieve-emblem').replaceWith(createTitleBadge(quest.id));
            const equip = document.createElement('button');
            equip.type = 'button';
            equip.className = 'achieve-equip';
            equip.dataset.titleEquip = quest.id;
            equip.disabled = !earned;
            equip.setAttribute('aria-pressed', String(this.equippedTitle === quest.id));
            const english = titleLanguage() === 'en';
            equip.textContent = earned ? (this.equippedTitle === quest.id ? (english ? 'Unequip' : '장착 해제') : (english ? 'Equip' : '장착')) : (quest.ready ? (english ? 'Claim quest reward first' : '퀘스트 보상 수령 후 획득') : (english ? 'Locked' : '미획득'));
            card.append(equip);
            card.querySelector('.achieve-condition').textContent = quest.description;
            const progress = card.querySelector('progress');
            progress.max = quest.target;
            progress.value = earned ? quest.target : quest.count;
            progress.setAttribute('aria-label', `${earned ? title : `미획득 칭호 ${index}`} 획득 진행률`);
            const percent = earned ? 100 : Math.floor(Math.max(0, Math.min(1, quest.count / quest.target)) * 100);
            card.querySelector('.achieve-progress-row span').textContent = `${percent}% · ${earned ? '달성' : `${quest.count.toLocaleString('ko-KR')} / ${quest.target.toLocaleString('ko-KR')}${quest.unit || '회'}`}`;
            list.append(card);
        }
    }
}
