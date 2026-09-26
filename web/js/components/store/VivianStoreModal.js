/**
 * VivianStoreModal Component
 * Controller for Vivian's General Store (비비안 잡화점 내부)
 * References: MOD_GDD_03_1_VivianStore.md / CORE_GDD_02_MarketEngine.md
 */

import { VIVIAN_TABS, VIVIAN_SHOP_CATALOG, VIVIAN_DIALOGUES } from '../../data/vivianStoreData.js';
import { ITEM_RARITIES } from '../../data/inventoryData.js';
import { getVivianStoreHtml } from './VivianStoreTemplate.js';
import { toastManager } from '../ToastManager.js';

export class VivianStoreModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks; // { onCashChanged, onInventoryAdd, onStaminaHeal, onOpenInventory, onClose }

        this.isOpen = false;
        this.activeTab = 'daily';
        this.selectedItemId = 'item_energy_drink';
        this.quantity = 1;

        // Daily purchase counter: { itemId: count }
        this.purchasedCounts = {};
        this.affinity = 35; // Vivian affinity (0~300, Lv.1~3)
        this.affinityMax = 100;

        this.typewriterTimer = null;

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const div = document.createElement('div');
        div.innerHTML = getVivianStoreHtml();
        this.container.appendChild(div.firstElementChild);
    }

    initDOM() {
        this.modalEl = document.getElementById('vivianStoreModal');
        this.btnClose = document.getElementById('btnVivianClose');
        this.userCashEl = document.getElementById('vivianUserCash');
        this.affinityBadgeEl = document.getElementById('vivianAffinityBadge');
        this.moodTagEl = document.getElementById('vivianMoodTag');
        this.speechTextEl = document.getElementById('vivianSpeechText');
        this.tabsContainer = document.getElementById('vivianTabsContainer');
        this.shelfBannerIcon = document.getElementById('shelfBannerIcon');
        this.shelfBannerDesc = document.getElementById('shelfBannerDesc');
        this.itemsGrid = document.getElementById('vivianItemsGrid');

        // Drawer elements
        this.drawerItemIcon = document.getElementById('drawerItemIcon');
        this.drawerItemName = document.getElementById('drawerItemName');
        this.drawerRarityBadge = document.getElementById('drawerRarityBadge');
        this.drawerItemDesc = document.getElementById('drawerItemDesc');
        this.drawerEffectsRow = document.getElementById('drawerEffectsRow');
        this.qtyInput = document.getElementById('vivianQtyInput');
        this.btnQtyMinus = document.getElementById('btnQtyMinus');
        this.btnQtyPlus = document.getElementById('btnQtyPlus');
        this.btnQtyMax = document.getElementById('btnQtyMax');
        this.totalPriceEl = document.getElementById('vivianTotalPrice');
        this.btnBuy = document.getElementById('btnVivianBuy');
        this.btnConsume = document.getElementById('btnVivianConsume');

        // Quick NPC actions
        this.btnTalk = document.getElementById('btnVivianTalk');
        this.btnTip = document.getElementById('btnVivianTip');
        this.btnSecretHint = document.getElementById('btnVivianSecretHint');
        this.btnOpenBag = document.getElementById('btnVivianOpenBag');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        this.modalEl?.addEventListener('click', (e) => {
            if (e.target === this.modalEl) this.close();
        });

        // Tab switching
        this.tabsContainer?.addEventListener('click', (e) => {
            const btn = e.target.closest('.vivian-tab-btn');
            if (btn && btn.dataset.tab) {
                this.switchTab(btn.dataset.tab);
            }
        });

        // Item selection via grid click
        this.itemsGrid?.addEventListener('click', (e) => {
            const card = e.target.closest('.vivian-item-card');
            if (card && card.dataset.id) {
                this.selectItem(card.dataset.id);
            }
        });

        // Quantity Steppers
        this.btnQtyMinus?.addEventListener('click', () => this.adjustQty(-1));
        this.btnQtyPlus?.addEventListener('click', () => this.adjustQty(1));
        this.btnQtyMax?.addEventListener('click', () => this.setMaxQty());
        this.qtyInput?.addEventListener('input', () => {
            const val = parseInt(this.qtyInput.value, 10);
            this.setQty(isNaN(val) ? 1 : val);
        });

        // Purchase Actions
        this.btnBuy?.addEventListener('click', () => this.executePurchase(false));
        this.btnConsume?.addEventListener('click', () => this.executePurchase(true));

        // NPC Dialogues
        this.btnTalk?.addEventListener('click', () => this.triggerDialogue('talk'));
        this.btnTip?.addEventListener('click', () => this.triggerDialogue('talk', 0));
        this.btnSecretHint?.addEventListener('click', () => this.triggerDialogue('secret'));
        this.btnOpenBag?.addEventListener('click', () => {
            if (this.callbacks.onOpenInventory) this.callbacks.onOpenInventory();
        });

        // Global Keydown
        window.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            if (e.key === 'Escape') {
                this.close();
            } else if (e.key === '1') this.switchTab('daily');
            else if (e.key === '2') this.switchTab('weekly');
            else if (e.key === '3') this.switchTab('secret');
            else if (e.key === '4') this.switchTab('books');
            else if (e.key === 'e' || e.key === 'E') {
                if (document.activeElement !== this.qtyInput) {
                    this.executePurchase(false);
                }
            }
        });
    }

    open() {
        this.isOpen = true;
        this.modalEl?.classList.remove('hidden');
        this.updateHeaderInfo();
        this.switchTab(this.activeTab);
        this.triggerDialogue('greet');
    }

    close() {
        this.isOpen = false;
        this.modalEl?.classList.add('hidden');
        if (this.callbacks.onClose) this.callbacks.onClose();
    }

    updateHeaderInfo() {
        const cash = this.callbacks.getCash ? this.callbacks.getCash() : 0;
        if (this.userCashEl) this.userCashEl.textContent = `${cash.toLocaleString()} G`;
        
        const level = this.affinity >= 200 ? 3 : (this.affinity >= 100 ? 2 : 1);
        const max = level === 1 ? 100 : (level === 2 ? 200 : 300);
        if (this.affinityBadgeEl) {
            this.affinityBadgeEl.textContent = `Lv.${level} 💖 (${this.affinity}/${max})`;
        }
    }

    switchTab(tabId) {
        if (!VIVIAN_TABS[tabId]) return;
        this.activeTab = tabId;

        // Update tab buttons
        const tabBtns = this.tabsContainer?.querySelectorAll('.vivian-tab-btn') || [];
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update banner
        const tabInfo = VIVIAN_TABS[tabId];
        if (this.shelfBannerIcon) this.shelfBannerIcon.textContent = tabInfo.icon;
        if (this.shelfBannerDesc) this.shelfBannerDesc.textContent = tabInfo.desc;

        this.renderItemsGrid();

        // Select first available item in tab
        const itemsInTab = VIVIAN_SHOP_CATALOG.filter(item => item.tab === tabId);
        if (itemsInTab.length > 0) {
            const hasCurrent = itemsInTab.some(i => i.id === this.selectedItemId);
            this.selectItem(hasCurrent ? this.selectedItemId : itemsInTab[0].id);
        }
    }

    renderItemsGrid() {
        if (!this.itemsGrid) return;
        const items = VIVIAN_SHOP_CATALOG.filter(item => item.tab === this.activeTab);

        this.itemsGrid.innerHTML = items.map(item => {
            const rarity = ITEM_RARITIES[item.rarity] || ITEM_RARITIES.common;
            const purchased = this.purchasedCounts[item.id] || 0;
            const isSoldOut = item.dailyLimit && purchased >= item.dailyLimit;
            const isSelected = item.id === this.selectedItemId;
            const isSecretLocked = item.tab === 'secret' && item.reqUnlock && this.affinity < 50;

            const stockText = isSoldOut ? '품절' : (item.dailyLimit ? `잔여 ${item.dailyLimit - purchased}개` : '재고 충분');

            return `
                <div class="vivian-item-card ${isSelected ? 'selected' : ''} ${isSoldOut ? 'sold-out' : ''} ${isSecretLocked ? 'locked' : ''}" 
                     data-id="${item.id}" style="--rarity-glow: ${rarity.glow}; --rarity-color: ${rarity.color};">
                    ${isSecretLocked ? `<div class="locked-overlay">🔒 <span>${item.reqUnlock.conditionDesc}</span></div>` : ''}
                    <div class="card-icon-area">
                        <span class="card-item-icon">${item.icon}</span>
                        <span class="card-rarity-pill" style="color: ${rarity.color};">${rarity.name}</span>
                    </div>
                    <div class="card-info-area">
                        <div class="card-item-name">${item.name}</div>
                        <div class="card-item-summary">${item.effects[0] || ''}</div>
                    </div>
                    <div class="card-bottom-row">
                        <div class="card-stock-badge ${isSoldOut ? 'empty' : ''}">${stockText}</div>
                        <div class="card-price-tag">🪙 ${item.price.toLocaleString()} G</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    selectItem(itemId) {
        const item = VIVIAN_SHOP_CATALOG.find(i => i.id === itemId);
        if (!item) return;

        this.selectedItemId = itemId;
        this.quantity = 1;

        // Highlight selected in grid
        const cards = this.itemsGrid?.querySelectorAll('.vivian-item-card') || [];
        cards.forEach(card => card.classList.toggle('selected', card.dataset.id === itemId));

        // Update Drawer UI
        const rarity = ITEM_RARITIES[item.rarity] || ITEM_RARITIES.common;
        if (this.drawerItemIcon) this.drawerItemIcon.textContent = item.icon;
        if (this.drawerItemName) this.drawerItemName.textContent = item.name;
        if (this.drawerRarityBadge) {
            this.drawerRarityBadge.textContent = rarity.name;
            this.drawerRarityBadge.style.color = rarity.color;
            this.drawerRarityBadge.style.borderColor = rarity.color;
        }
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
        if (this.totalPriceEl) this.totalPriceEl.textContent = `${total.toLocaleString()} G`;
    }

    executePurchase(isConsume = false) {
        const item = VIVIAN_SHOP_CATALOG.find(i => i.id === this.selectedItemId);
        if (!item) return;

        const purchased = this.purchasedCounts[item.id] || 0;
        if (item.dailyLimit && purchased + this.quantity > item.dailyLimit) {
            toastManager.show('⚠️ [구매 제한] 일일 최대 구매 한도를 초과했습니다.');
            return;
        }

        const totalPrice = item.price * this.quantity;
        const currentCash = this.callbacks.getCash ? this.callbacks.getCash() : 0;

        if (currentCash < totalPrice) {
            this.triggerDialogue('poor');
            toastManager.show('💸 [골드 부족] 결제에 필요한 골드가 부족합니다! 비트 물류 노동이나 주식 실현 손익을 확보하세요.');
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
            if (item.id === 'item_energy_drink' || item.id === 'item_caffeine_shot') {
                const healAmount = item.id === 'item_caffeine_shot' ? 2 : 1;
                if (this.callbacks.onStaminaHeal) this.callbacks.onStaminaHeal(healAmount);
            }
            this.triggerDialogue('consume');
            toastManager.show(`⚡ [즉시 사용] ${item.name} x${this.quantity}개를 섭취하여 효과가 즉시 발동되었습니다!`, true);
        } else {
            if (this.callbacks.onInventoryAdd) {
                this.callbacks.onInventoryAdd({
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    rarity: item.rarity,
                    icon: item.icon,
                    quantity: this.quantity,
                    maxStack: 99,
                    price: item.price,
                    desc: item.desc,
                    effects: item.effects,
                    actionType: item.category === 'consumable' ? 'use' : 'equip',
                    actionLabel: item.category === 'consumable' ? '사용하기' : '장착하기'
                });
            }
            this.triggerDialogue('done');
            toastManager.show(`🛍️ [구매 완료] ${item.name} x${this.quantity}개가 소지품 인벤토리에 보관되었습니다. (-${totalPrice.toLocaleString()}G)`, true);
        }

        // Brand-Linked Consumption Callback
        if (item.linkedStock && this.callbacks.onStockBoost) {
            this.callbacks.onStockBoost(item.linkedStock.id, totalPrice);
        }

        this.updateHeaderInfo();
        this.renderItemsGrid();
        this.selectItem(item.id);
    }

    triggerDialogue(type = 'greet', fixedIdx = null) {
        const pool = VIVIAN_DIALOGUES[type] || VIVIAN_DIALOGUES.greet;
        const text = fixedIdx !== null ? pool[fixedIdx] : pool[Math.floor(Math.random() * pool.length)];

        if (this.speechTextEl) {
            if (this.typewriterTimer) clearInterval(this.typewriterTimer);
            this.speechTextEl.textContent = '';
            let idx = 0;
            this.typewriterTimer = setInterval(() => {
                if (idx < text.length) {
                    this.speechTextEl.textContent += text[idx];
                    idx++;
                } else {
                    clearInterval(this.typewriterTimer);
                }
            }, 18);
        }

        if (this.moodTagEl) {
            const moodMap = {
                greet: '영업 중 • 침착',
                consume: '흥미 • 조언',
                hardware: '진지 • 분석',
                secret: '보안 • 귓속말',
                done: '거래 완료 • 흡족',
                poor: '경고 • 단호',
                talk: '상점주 • 환담'
            };
            this.moodTagEl.textContent = moodMap[type] || '영업 중';
        }
    }
}
