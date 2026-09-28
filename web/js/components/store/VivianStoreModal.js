/**
 * VivianStoreModal Component
 * Controller for Vivian's General Store (비비안 잡화점 내부)
 * References: MOD_GDD_03_1_VivianStore.md / CORE_GDD_02_MarketEngine.md
 */

import { VIVIAN_TABS, VIVIAN_SHOP_CATALOG, VIVIAN_DIALOGUES } from '../../data/vivianStoreData.js';
import { ITEM_RARITIES } from '../../data/inventoryData.js';
import { itemIconHtml } from '../../data/itemArtwork.js';
import { getVivianStoreHtml } from './VivianStoreTemplate.js';
import { toastManager } from '../ToastManager.js';
import { StorePlayerController } from './StorePlayerController.js';
import { VivianRoomEditor } from './VivianRoomEditor.js';

export class VivianStoreModal {
    constructor(container, callbacks = {}, {allowLayoutEditing=false} = {}) {
        this.allowLayoutEditing = allowLayoutEditing;
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
        this.player = new StorePlayerController();

        this.render();
        this.initDOM();
        this.roomEditor = new VivianRoomEditor(this.interiorEl,
            navigation => this.player.configureRoom(navigation),
            () => this.player.stop(), {enabled:this.allowLayoutEditing});
        this.initEventListeners();
    }

    render() {
        const div = document.createElement('div');
        div.innerHTML = getVivianStoreHtml({allowLayoutEditing:this.allowLayoutEditing});
        this.container.appendChild(div.firstElementChild);
    }

    initDOM() {
        this.modalEl = document.getElementById('vivianStoreModal');
        this.btnClose = document.getElementById('btnVivianClose');
        this.interiorEl = document.getElementById('vivianInterior');
        this.shopPanel = document.getElementById('vivianShopPanel');
        this.playerEl = document.getElementById('vivianPlayer');
        this.exitAction = document.getElementById('btnVivianExitAction');
        this.userCashEl = document.getElementById('vivianUserCash');
        this.affinityBadgeEl = document.getElementById('vivianAffinityBadge');
        this.moodTagEl = document.getElementById('vivianMoodTag');
        this.portraitEl = document.getElementById('vivianPortrait');
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
        this.exitAction?.addEventListener('click', () => {
            if (!this.isShopping && !this.roomEditor?.active && this.player.nearby()?.action==='exit') this.close();
        });
        document.getElementById('vivianWalkway').addEventListener('click', e => {
            if (this.isShopping || this.roomEditor?.active) return;
            const rect = this.interiorEl.getBoundingClientRect();
            this.player.moveTo((e.clientX - rect.left) / rect.width * 1536, (e.clientY - rect.top) / rect.height * 1024);
        });
        window.addEventListener('keyup', e => this.player.keys.delete(e.key.toLowerCase()));
        window.addEventListener('blur', () => this.player.stop());
        document.addEventListener('visibilitychange', () => this.player.stop());
        this.btnClose?.addEventListener('click', () => this.showInterior());
        document.getElementById('btnVivianDoor')?.addEventListener('click', () => {
            if (this.roomEditor?.active) return;
            if (this.player.nearby()?.action === 'exit') this.close();
            else this.player.moveTo(this.player.places[0].x, this.player.places[0].y);
        });
        this.interiorEl?.querySelectorAll('[data-store-browse]').forEach(button => {
            button.addEventListener('click', () => {
                if (this.roomEditor?.active) return;
                this.lastInteriorControl = button;
                if (this.player.nearby()?.action === 'shop') this.showShop(button.dataset.storeBrowse);
                else {
                    const counter = this.player.places.find(place => place.action === 'shop');
                    this.player.moveTo(counter.x,counter.y);
                }
            });
        });
        this.modalEl?.addEventListener('click', (e) => {
            if (e.target === this.modalEl && this.isShopping) this.showInterior();
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
            // Closing the store must not pass the same F press to the town
            // listener, which would immediately reopen the entrance.
            e.stopImmediatePropagation();
            if (this.roomEditor?.active) {
                if (e.key === 'Escape') { e.preventDefault(); this.roomEditor.cancel(); }
                return;
            }
            if (!this.isShopping) {
                const key = e.key.toLowerCase();
                if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) {
                    e.preventDefault();
                    this.player.keys.add(key);
                }
                if (key === 'f' && !e.repeat) {
                    e.preventDefault();
                    this.interactNearby();
                    return;
                }
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                if (e.repeat) return;
                if (this.isShopping) this.showInterior();
                else this.close();
            } else if (!this.isShopping) {
                return;
            } else if (e.key === '1') this.switchTab('daily');
            else if (e.key === '2') this.switchTab('weekly');
            else if (e.key === '3') this.switchTab('secret');
            else if (e.key === 'e' || e.key === 'E') {
                if (document.activeElement !== this.qtyInput) {
                    this.executePurchase(false);
                }
            }
        });
    }

    open() {
        if (this.isOpen) return;
        this.player.reset();
        this.isOpen = true;
        this.modalEl?.classList.remove('hidden');
        this.showInterior();
        this.updateHeaderInfo();
        this.switchTab(this.activeTab);
        this.triggerDialogue('greet');
        this.lastFrame = performance.now();
        this.animatePlayer(this.lastFrame);
    }

    animatePlayer(now) {
        if (!this.isOpen) return;
        if (!this.isShopping && !this.roomEditor?.active) this.player.update((now - this.lastFrame) / 1000);
        this.lastFrame = now;
        this.playerEl.style.left = `${this.player.x / 1536 * 100}%`;
        this.playerEl.style.top = `${this.player.y / 1024 * 100}%`;
        this.playerEl.style.zIndex = Math.round(100 + this.player.y);
        const body = this.playerEl.querySelector('.town-char-body');
        body.style.transform = `scaleX(${this.player.facing}) translateY(${-Math.sin(this.player.phase) * 5}px)`;
        this.updateExitAction();
        this.playerFrame = requestAnimationFrame(time => this.animatePlayer(time));
    }

    updateExitAction() {
        if (!this.exitAction) return;
        const exit=this.player.places.find(place=>place.action==='exit');
        this.exitAction.hidden=!this.isOpen || this.isShopping || Boolean(this.roomEditor?.active) || this.player.nearby()?.action!=='exit';
        if(exit) {
            this.exitAction.style.left=`${exit.x/1536*100}%`;
            this.exitAction.style.top=`${(exit.y+35)/1024*100}%`;
        }
    }

    interactNearby() {
        if (!this.isOpen || this.isShopping || this.roomEditor?.active) return;
        const nearby = this.player.nearby();
        if (nearby?.action === 'exit') this.close();
        else if (nearby) this.showShop();
    }

    showInterior() {
        this.isShopping = false;
        this.shopPanel?.classList.add('hidden');
        this.interiorEl.inert = false;
        this.interiorEl.focus({ preventScroll: true });
    }

    showShop(tabId = 'daily') {
        if (!this.isOpen || this.roomEditor?.active || this.player.nearby()?.action !== 'shop') return;
        this.player.stop();
        this.isShopping = true;
        this.interiorEl.inert = true;
        this.shopPanel?.classList.remove('hidden');
        this.updateHeaderInfo();
        this.switchTab(tabId);
        this.btnClose?.focus();
    }

    close() {
        this.roomEditor?.cancel();
        this.player.stop();
        cancelAnimationFrame(this.playerFrame);
        this.isOpen = false;
        this.isShopping = false;
        clearInterval(this.typewriterTimer);
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
            const isSecretLocked = this.isItemLocked(item);

            const stockText = isSoldOut ? '품절' : (item.dailyLimit ? `잔여 ${item.dailyLimit - purchased}개` : '재고 충분');

            return `
                <div class="vivian-item-card ${isSelected ? 'selected' : ''} ${isSoldOut ? 'sold-out' : ''} ${isSecretLocked ? 'locked' : ''}" 
                     data-id="${item.id}" style="--rarity-glow: ${rarity.glow}; --rarity-color: ${rarity.color};">
                    ${isSecretLocked ? `<div class="locked-overlay">🔒 <span>${item.reqUnlock.conditionDesc}</span></div>` : ''}
                    <div class="card-icon-area">
                        <span class="card-item-icon">${itemIconHtml(item)}</span>
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
        if (this.drawerItemIcon) this.drawerItemIcon.innerHTML = itemIconHtml(item);
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
        const locked = this.isItemLocked(item);
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

    executePurchase(isConsume = false) {
        const item = VIVIAN_SHOP_CATALOG.find(i => i.id === this.selectedItemId);
        if (!item) return;
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
                const healAmount = this.quantity;
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
                    actionType: item.actionType || (item.category === 'consumable' ? 'use' : 'equip'),
                    actionLabel: item.actionLabel || (item.category === 'consumable' ? '사용하기' : '장착하기')
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
        const expression = {
            greet: 'neutral', talk: 'neutral', hardware: 'skeptical',
            consume: 'smile', done: 'smile', poor: 'skeptical', secret: 'secret'
        }[type] || 'neutral';
        if (this.portraitEl) {
            this.portraitEl.src = `assets/characters/vivian/vivian-dialogue-${expression}-v1.png`;
            this.portraitEl.alt = `비비안 — ${{ neutral: '차분한 미소', smile: '흡족한 미소', skeptical: '의심과 단호함', secret: '비밀스러운 귓속말' }[expression]}`;
        }
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
