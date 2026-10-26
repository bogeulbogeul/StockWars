import { VivianCatalogView } from './VivianCatalogView.js';
import { VIVIAN_SHOP_CATALOG } from '../../data/vivianStoreData.js';
import { toastManager } from '../ToastManager.js';

export class VivianPurchaseController extends VivianCatalogView {
    executePurchase(isConsume = false) {
        if (this.receiptEl && !this.receiptEl.hidden) return;
        const item = VIVIAN_SHOP_CATALOG.find(i => i.id === this.selectedItemId);
        if (!item) return;
        if (this.callbacks.onPurchaseItem) {
            const result = this.callbacks.onPurchaseItem(item.id, this.quantity, isConsume);
            toastManager.show(result.message, result.success);
            if (result.success) this.showReceipt(item, this.quantity, isConsume);
            this.updateHeaderInfo();
            this.renderItemsGrid();
            this.selectItem(item.id);
            return;
        }
        if (this.isItemLocked(item)) {
            toastManager.show(`🔒 ${item.reqUnlock.conditionDesc}`, false);
            return;
        }

        const purchased = this.purchasedCounts[item.id] || 0;
        if (item.dailyLimit && purchased + this.quantity > item.dailyLimit) {
            toastManager.show('⚠️ [구매 제한] 일일 최대 구매 한도를 초과했습니다.');
            return;
        }

        const totalPrice = item.price * this.quantity;
        const currentCash = this.callbacks.getCash ? this.callbacks.getCash() : 0;

        if (currentCash < totalPrice) {
            this.triggerDialogue('poor');
            toastManager.show('💸 [잔액 부족] 결제에 필요한 잎이 부족합니다! 보유 현금과 생활비를 확인하세요.');
            return;
        }

        if (isConsume && item.packSize && this.quantity !== 1) {
            toastManager.show('바로 먹기는 한 번에 한 상자씩 구매해 주세요.', false);
            return;
        }

        // Deduct Gold
        if (this.callbacks.onDeductCash) {
            this.callbacks.onDeductCash(totalPrice);
        }

        // Record Daily Stock
        this.purchasedCounts[item.id] = (this.purchasedCounts[item.id] || 0) + this.quantity;
        this.affinity = Math.min(300, this.affinity + 5 * this.quantity);

        // Instant Consumption vs Inventory Storage
        if (isConsume && item.instantUsable) {
            if (item.recoveryFood) {
                const healAmount = this.quantity;
                if (this.callbacks.onStaminaHeal) this.callbacks.onStaminaHeal(healAmount);
            }
            if (item.packSize) this.deliverToBag(item, 1, item.packSize - 1);
            this.triggerDialogue('consume');
            toastManager.show(`⚡ [즉시 사용] ${item.name} x${this.quantity}개를 섭취하여 효과가 즉시 발동되었습니다!`, true);
        } else {
            this.deliverToBag(item, this.quantity);
            this.triggerDialogue('done');
            toastManager.show(`🛍️ [구매 완료] ${item.name} x${this.quantity}개가 소지품 인벤토리에 보관되었습니다. (-${totalPrice.toLocaleString()}잎)`, true);
        }

        this.showReceipt(item, this.quantity, isConsume && item.instantUsable);

        // Brand-Linked Consumption Callback
        if (item.linkedStock && this.callbacks.onStockBoost) {
            this.callbacks.onStockBoost(item.linkedStock.id, totalPrice);
        }

        this.updateHeaderInfo();
        this.renderItemsGrid();
        this.selectItem(item.id);
    }

    deliverToBag(item, quantity, openedRemaining = 4) {
        this.callbacks.onInventoryAdd?.({
            ...item, name: item.inventoryName || item.name, quantity, maxStack: 99,
            price: item.price,
            ...(item.packSize ? {cookieSet: true, openedRemaining} : {}),
            actionType: item.actionType || (item.category === 'consumable' ? 'use' : 'equip'),
            actionLabel: item.packSize ? '쿠키 1개 꺼내 먹기' : item.actionLabel || '사용하기'
        });
    }

    showReceipt(item, quantity, consumed) {
        if (!this.receiptEl) return;
        const fields = {
            vivianReceiptDate: new Date().toLocaleString('ko-KR'),
            vivianReceiptItem: item.name,
            vivianReceiptQuantity: item.packSize ? `${quantity}상자 (${quantity * item.packSize}개입)` : `${quantity}개`,
            vivianReceiptPrice: `${item.price.toLocaleString()}잎`,
            vivianReceiptTotal: `${(item.price*quantity).toLocaleString()}잎`,
            vivianReceiptDelivery: item.packSize
                ? (consumed ? `쿠키 1개를 먹고 ${quantity * item.packSize - 1}개 남은 세트를 가방에 넣었습니다.` : `꿀 쿠키 ${quantity}세트를 가방에 넣었습니다.`)
                : consumed ? '구매한 상품을 즉시 사용했습니다.' : '구매한 상품을 소지품에 넣었습니다.'
        };
        for (const [id,text] of Object.entries(fields)) this.receiptEl.querySelector(`#${id}`).textContent=text;
        this.receiptEl.hidden=false;
        this.shopPanel.inert=true;
        this.receiptClose.focus();
    }

    hideReceipt(restoreFocus=true) {
        if (!this.receiptEl || this.receiptEl.hidden) return;
        this.receiptEl.hidden=true;
        this.shopPanel.inert=false;
        if (restoreFocus) this.btnBuy?.focus();
    }

}
