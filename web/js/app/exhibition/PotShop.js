import { getFlowerShopHtml } from '../../components/store/VivianShopTemplate.js';
import { EXHIBITION } from './State.js';

export const SEED_POT_ART = new URL('../../../assets/items/story/flowerpot.png', import.meta.url).href;
const potArt = `<img class="item-artwork" src="${SEED_POT_ART}" alt="씨앗용 화분" draggable="false">`;

// The adopted flower-shop view, with only the one-time first-day seed pot.
export function openSeedPotShop(app) {
    const dialog = document.createElement('dialog'); dialog.className = 'seed-pot-shop';
    dialog.setAttribute('aria-label', '봉봉 잡화점 화분 구매');
    dialog.innerHTML = getFlowerShopHtml();
    const find = id => dialog.querySelector(`#${id}`);
    find('vivianShopPanel').classList.remove('hidden');
    find('vivianUserCash').textContent = `${app.state.cash.toLocaleString()}잎`;
    find('vivianItemsGrid').innerHTML = `<button type="button" class="vivian-item-card selected" aria-pressed="true" aria-label="씨앗용 화분 선택"><span class="flower-goods-art">${potArt}</span><span class="flower-goods-label"><span class="flower-goods-name">씨앗용 화분</span><span class="flower-goods-price">${EXHIBITION.pot}잎</span></span><span class="flower-goods-stock">남은 수량 1개</span></button>`;
    find('drawerItemIcon').innerHTML = potArt;
    find('drawerItemName').textContent = '씨앗용 화분';
    find('drawerItemDesc').textContent = '가지고 온 씨앗을 심을 작은 화분이에요. 집에 돌아가 씨앗을 심어 보세요.';
    find('vivianTotalPrice').textContent = `${EXHIBITION.pot}잎`;
    for (const id of ['btnQtyMinus', 'btnQtyPlus', 'btnQtyMax', 'vivianQtyInput']) find(id).disabled = true;
    const buy = find('btnVivianBuy');
    buy.disabled = !!app.state.flags.pot || !app.state.flags.grant || app.state.cash < EXHIBITION.pot;
    if (app.state.cash < EXHIBITION.pot) find('drawerItemDesc').textContent += ' 잎이 부족해요.';
    let bought = false;
    buy.onclick = () => {
        if (bought || buy.disabled) return;
        bought = true; buy.disabled = true; dialog.close();
    };
    find('btnVivianClose').onclick = () => dialog.close();
    dialog.addEventListener('close', () => {
        dialog.remove();
        if (bought) app.next('pot');
        else {
            app.view.panel.hidden = false;
            app.view.line({ speaker: '봉봉', text: '씨앗을 심을 화분은 여기 있어요. 준비되면 골라 주세요.' }, () => openSeedPotShop(app));
        }
    }, { once: true });
    app.view.panel.hidden = true;
    document.body.append(dialog); dialog.showModal(); buy.focus();
    return dialog;
}

