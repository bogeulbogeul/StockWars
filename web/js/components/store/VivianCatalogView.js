import { VIVIAN_SHOP_CATALOG } from '../../data/vivianStoreData.js';
import { itemIconHtml } from '../../data/itemArtwork.js';
import { updateShopProductArt } from '../store3d/ShopProductArt.js';

// Catalog selection and quantity calculations shared by the shop controller.
export class VivianCatalogView {
    updateHeaderInfo() {
        const shopState = this.callbacks.getShopState?.();
        if (shopState) { this.affinity = shopState.affinity; this.purchasedCounts = shopState.purchases; }
        const cash = this.callbacks.getCash ? this.callbacks.getCash() : 0;
        if (this.userCashEl) this.userCashEl.textContent = `${cash.toLocaleString()}잎`;

        const level = this.affinity >= 200 ? 3 : (this.affinity >= 100 ? 2 : 1);
        const max = level === 1 ? 100 : (level === 2 ? 200 : 300);
        if (this.affinityBadgeEl) {
            this.affinityBadgeEl.textContent = `Lv.${level} 💖 (${this.affinity}/${max})`;
        }
    }

    switchTab(tabId) {
        // Keep the public method for existing room/counter callers; every call opens one shelf.
        this.activeTab = 'all';
        if (this.shelfBannerIcon) this.shelfBannerIcon.textContent = '✿';
        if (this.shelfBannerDesc) this.shelfBannerDesc.textContent = '간식과 차, 작은 소식까지 한 선반에서 만나 보세요.';
        this.renderItemsGrid();
        const current = VIVIAN_SHOP_CATALOG.find(item => item.id === this.selectedItemId);
        this.selectItem(current?.id || VIVIAN_SHOP_CATALOG[0].id);
    }

    renderItemsGrid() {
        if (!this.itemsGrid) return;
        const items = VIVIAN_SHOP_CATALOG;

        this.itemsGrid.innerHTML = items.map(item => {
            const purchased = this.purchasedCounts[item.id] || 0;
            const isSoldOut = item.dailyLimit && purchased >= item.dailyLimit;
            const isSelected = item.id === this.selectedItemId;
            const isSecretLocked = this.isItemLocked(item);

            const stockText = isSoldOut ? '품절' : (item.dailyLimit ? `잔여 ${item.dailyLimit - purchased}개` : '');

            return `
                <button type="button" class="vivian-item-card ${isSelected ? 'selected' : ''} ${isSoldOut ? 'sold-out' : ''} ${isSecretLocked ? 'locked' : ''}"
                     data-id="${item.id}" aria-pressed="${isSelected}" aria-label="${item.name}, ${item.price.toLocaleString()}잎${isSoldOut ? ', 품절' : ''}${isSecretLocked ? ', 잠김' : ''}">
                    <span class="flower-goods-art">${itemIconHtml(item)}<span class="flower-goods-check" aria-hidden="true">✓</span></span>
                    <span class="flower-goods-label"><span class="flower-goods-name">${item.name}</span><span class="flower-goods-price">${item.price.toLocaleString()}잎${item.packSize ? ` / ${item.packSize}개입` : ''}</span></span>
                    <span class="flower-goods-stock ${isSoldOut ? 'empty' : ''}">${isSecretLocked ? '🔒 ' + item.reqUnlock.conditionDesc : stockText}</span>
                </button>
            `;
        }).join('');
        updateShopProductArt(this);
    }

    selectItem(itemId) {
        const item = VIVIAN_SHOP_CATALOG.find(i => i.id === itemId);
        if (!item) return;

        this.selectedItemId = itemId;
        this.quantity = 1;
        if (this.btnConsume) this.btnConsume.textContent = item.packSize ? '1개 먹고 나머지는 가방에' : '바로 사용할게요';

        // Highlight selected in grid
        const cards = this.itemsGrid?.querySelectorAll('.vivian-item-card') || [];
        cards.forEach(card => {
            card.classList.toggle('selected', card.dataset.id === itemId);
            card.setAttribute('aria-pressed', String(card.dataset.id === itemId));
        });

        // Update Drawer UI
        if (this.drawerItemIcon) this.drawerItemIcon.innerHTML = itemIconHtml(item);
        updateShopProductArt(this);
        if (this.drawerItemName) this.drawerItemName.textContent = item.name;
        if (this.drawerItemDesc) this.drawerItemDesc.textContent = item.desc;
        if (this.drawerEffectsRow) {
            this.drawerEffectsRow.innerHTML = item.effects.map(eff => `<span class="effect-tag">${eff}</span>`).join('');
            if (item.linkedStock) {
                this.drawerEffectsRow.innerHTML += `<span class="effect-tag linked">📈 ${item.linkedStock.name} 매출 연동</span>`;
            }
        }

        // Toggle Consume button
        if (this.btnConsume) {
            this.btnConsume.style.display = item.instantUsable ? 'inline-flex' : 'none';
        }

        this.updatePriceCalculation();
    }

    adjustQty(delta) {
        this.setQty(this.quantity + delta);
    }

    setQty(qty) {
        const item = VIVIAN_SHOP_CATALOG.find(i => i.id === this.selectedItemId);
        if (!item) return;

        const purchased = this.purchasedCounts[item.id] || 0;
        const maxAllowed = item.dailyLimit ? Math.max(1, item.dailyLimit - purchased) : 99;

        this.quantity = Math.max(1, Math.min(qty, maxAllowed));
        if (this.qtyInput) this.qtyInput.value = this.quantity;
        this.updatePriceCalculation();
    }

    setMaxQty() {
        const item = VIVIAN_SHOP_CATALOG.find(i => i.id === this.selectedItemId);
        if (!item) return;

        const cash = this.callbacks.getCash ? this.callbacks.getCash() : 0;
        const affordable = Math.floor(cash / item.price);
        const purchased = this.purchasedCounts[item.id] || 0;
        const limitLeft = item.dailyLimit ? Math.max(0, item.dailyLimit - purchased) : 99;

        const maxQty = Math.max(1, Math.min(affordable > 0 ? affordable : 1, limitLeft));
        this.setQty(maxQty);
    }

    updatePriceCalculation() {
        const item = VIVIAN_SHOP_CATALOG.find(i => i.id === this.selectedItemId);
        if (!item) return;

        const total = item.price * this.quantity;
        if (this.totalPriceEl) this.totalPriceEl.textContent = `${total.toLocaleString()}잎`;
        const locked = this.isItemLocked(item) || !!(item.dailyLimit && (this.purchasedCounts[item.id] || 0) >= item.dailyLimit);
        if (this.btnBuy) this.btnBuy.disabled = locked;
        if (this.btnConsume) this.btnConsume.disabled = locked;
    }

    isItemLocked(item) {
        if (!item.reqUnlock) return false;
        // Achievement values must come from gameplay; affinity alone cannot unlock these items.
        const progress = {
            ...this.callbacks.getShopProgress?.(),
            trustLevel: this.affinity >= 200 ? 3 : (this.affinity >= 100 ? 2 : 1)
        };
        return Object.entries(item.reqUnlock).some(([key, required]) =>
            key !== 'conditionDesc' && (!Number.isFinite(progress[key]) || progress[key] < required));
    }

}
