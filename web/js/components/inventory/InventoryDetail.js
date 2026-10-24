import { ITEM_CATEGORIES, ITEM_RARITIES } from '../../data/inventoryData.js';
import { itemIconHtml } from '../../data/itemArtwork.js';

export function renderInventoryDetail(item) {
        if (!item || item.category === 'apparel') {
            this.detailContainer.innerHTML = `
                <div class="inv-detail-empty">
                    <div class="empty-icon">🎒</div>
                    <div>${this.giftMode?'보낼 수 있는 아이템이 없습니다.':'선택된 아이템이 없습니다.'}</div>
                </div>
            `;
            return;
        }

        const rarity = ITEM_RARITIES[item.rarity] || ITEM_RARITIES.common;
        const category = ITEM_CATEGORIES[item.category] || ITEM_CATEGORIES.etc;
        const visible = this.getItemPresentation(item);

        let actionBtnText = item.actionLabel || '사용하기';
        let actionClass = 'inv-btn-primary';

        if (item.category === 'intel') {
            actionBtnText = '확인하기';
        }

        const readBadgeHtml = item.isRead
            ? `<span style="font-size: 11px; color: #ff8a80; background: rgba(255,59,92,0.15); border: 1px solid rgba(255,59,92,0.3); padding: 1px 6px; border-radius: 4px; margin-left: 6px;">열람 완료</span>`
            : '';

        this.detailContainer.innerHTML = `
            <div class="inv-detail-preview">
                <div class="inv-preview-box" style="border-color: ${rarity.color}; box-shadow: 0 0 20px ${rarity.glow}">
                    <span>${itemIconHtml(item)}</span>
                </div>
                <div class="inv-detail-name">${visible.name}</div>
                <div class="inv-detail-tags">
                    <span class="inv-rarity-tag" style="background: ${rarity.color}">${rarity.name}</span>
                    <span class="inv-category-tag">${category.icon} ${category.name}</span>
                    ${readBadgeHtml}
                </div>
            </div>

            <div class="inv-detail-desc">${visible.desc}</div>

            ${visible.effects && visible.effects.length > 0 ? `
                <div class="inv-detail-effects">
                    ${visible.effects.map(eff => `<div class="inv-effect-item">${eff}</div>`).join('')}
                </div>
            ` : ''}

            <div class="inv-detail-price-row">
                <span>상점 가치 / 매각가</span>
                <span class="inv-price-val">💰 ${(item.price || 0).toLocaleString()} G</span>
            </div>

            <div class="inv-actions">
                <button class="${actionClass}" id="btnInvActionPrimary">${actionBtnText}</button>
                <button class="inv-btn-secondary" id="btnInvActionDiscard">버리기</button>
            </div>
        `;

        // Action button event handlers
        if(this.giftMode){
            const mode=this.giftMode,actions=this.detailContainer.querySelector('.inv-actions');actions.replaceChildren();
            const info=document.createElement('p');info.style.cssText='font-size:12px;color:#9bdfe8;line-height:1.5';info.textContent=`보유 ${item.quantity}개 · 오늘 남은 선물 ${mode.remaining()}/3개 · 찌라시 포함 하루 총 3개 · 1회 1개 전달 · 원본 1개 소모`;
            actions.before(info);
            if(item.category==='intel'){const read=document.createElement('button');read.className='inv-btn-secondary';read.textContent=item.isRead?'찌라시 다시 보기':'찌라시 열람';read.disabled=!!mode.busy;read.onclick=()=>this.handleItemAction(item);actions.append(read);}
            const send=document.createElement('button');send.className='inv-btn-primary';send.dataset.giftSend='';send.textContent=`선택한 아이템 1개 선물하기`;send.disabled=!!mode.busy||mode.remaining()<=0;
            send.onclick=async()=>{if(mode.busy)return;mode.busy=true;this.renderDetail(item);try{await mode.send(item);}finally{mode.busy=false;if(this.giftMode===mode)this.renderGrid();}};actions.append(send);
            return;
        }
        document.getElementById('btnInvActionPrimary')?.addEventListener('click', () => {
            this.handleItemAction(item);
        });

        document.getElementById('btnInvActionDiscard')?.addEventListener('click', () => {
            this.discardItem(item.id);
        });
    }

