import { titleName } from '../data/playerTitles.js';
// Only rendered inside an NPC conversation. Unaccepted contracts never enter the HUD.
export function renderNpcQuestOffers(container, callbacks, giver) {
    container.replaceChildren();
    const offers = callbacks.getQuestOffers?.(giver) || [];
    container.hidden = offers.length === 0;
    if (!offers.length) return;
    const heading = document.createElement('strong'); heading.textContent = '부탁할 일이 있어요'; container.append(heading);
    for (const quest of offers) {
        const card = document.createElement('section'); card.className = 'npc-quest-offer';
        const title = document.createElement('strong'); title.textContent = quest.title;
        const description = document.createElement('p'); description.textContent = quest.description;
        const reward = document.createElement('small'); reward.textContent = `보상 ${quest.gold}G · ${quest.exp} EXP · 칭호 [${titleName(quest.id)}]`;
        const accept = document.createElement('button'); accept.type = 'button'; accept.textContent = '의뢰 수락'; accept.dataset.questAccept = quest.id;
        accept.onclick = () => {
            const result = callbacks.onAcceptQuest?.(quest.id, giver);
            if (result?.success) renderNpcQuestOffers(container, callbacks, giver);
        };
        card.append(title, description, reward, accept); container.append(card);
    }
}
