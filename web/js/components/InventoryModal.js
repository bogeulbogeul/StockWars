import { renderInventoryDetail } from './inventory/InventoryDetail.js';
import { cookiePresentation, eatCookie } from '../engine/CookieSets.js';
import { bindingLabel } from '../app/GameKeys.js';
import { gameKey } from '../app/GameKeys.js';
/**
 * InventoryModal Component
 * Unity equivalent: UIInventoryModal.cs / ItemStorageKernel.cs
 * Manages player bag, consumables, furniture, and documents.
 */

import { ITEM_CATEGORIES, DEFAULT_INVENTORY_ITEMS } from '../data/inventoryData.js';
import { RumorPopup, rumorDecryption } from './inventory/RumorPopup.js';
import { itemIconHtml } from '../data/itemArtwork.js';

export class InventoryModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.items = JSON.parse(JSON.stringify(DEFAULT_INVENTORY_ITEMS));
        this.maxSlots = 24;
        this.activeCategory = 'all';
        this.selectedItemId = this.items[0]?.id || null;
        this.searchQuery = '';

        this.render();
        this.initDOM();
        this.rumorPopup = new RumorPopup(this.container, this.callbacks);
        this.initEventListeners();
    }

    render() {
        const categoryTabsHtml = Object.values(ITEM_CATEGORIES).filter(cat => !['apparel', 'etc'].includes(cat.key)).map(cat => `
            <button class="inv-tab-btn ${cat.key === this.activeCategory ? 'active' : ''}" data-cat="${cat.key}">
                <span>${cat.icon}</span> <span>${cat.name}</span>
            </button>
        `).join('');

        const html = `
            <div id="inventoryModal" class="modal-overlay hidden">
                <div class="modal-card inventory-card">
                    <!-- Header -->
                    <div class="inventory-header">
                        <div class="inventory-title-group">
                            <span class="inventory-header-icon">🎒</span>
                            <span class="inventory-title-text">소지품 인벤토리 <span style="font-size: 11px; opacity: 0.7; font-family: var(--font-mono); background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-left: 6px;" data-game-key="i">${bindingLabel('i')}</span></span>
                        </div>
                        <div class="inventory-meta-group">
                            <span class="inventory-capacity-badge" id="invCapacityBadge">보관함 8 / 24</span>
                            <button class="inventory-close-btn" id="btnCloseInventory" title="닫기 (I)">✕</button>
                        </div>
                    </div>

                    <!-- Filter Tabs & Search Bar -->
                    <div class="inventory-controls-bar">
                        <div class="inventory-tabs" id="invTabsContainer">
                            ${categoryTabsHtml}
                        </div>
                        <div class="inventory-search-group">
                            <input type="text" class="inv-search-input" id="invSearchInput" placeholder="아이템 검색..." />
                        </div>
                    </div>

                    <!-- Main Split Body -->
                    <div class="inventory-body">
                        <!-- Left: Item Grid -->
                        <div class="inventory-grid-section">
                            <div class="inventory-grid" id="invGridContainer">
                                <!-- Populated dynamically -->
                            </div>
                        </div>

                        <!-- Right: Item Detail & Action Panel -->
                        <div class="inventory-detail-section" id="invDetailContainer">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modal = document.getElementById('inventoryModal');
        this.btnClose = document.getElementById('btnCloseInventory');
        this.capacityBadge = document.getElementById('invCapacityBadge');
        this.tabsContainer = document.getElementById('invTabsContainer');
        this.searchInput = document.getElementById('invSearchInput');
        this.gridContainer = document.getElementById('invGridContainer');
        this.detailContainer = document.getElementById('invDetailContainer');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Category tab filter
        this.tabsContainer?.addEventListener('click', (e) => {
            const btn = e.target.closest('.inv-tab-btn');
            if (!btn) return;
            const cat = btn.dataset.cat;
            this.setCategory(cat);
        });

        // Search filtering
        this.searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim().toLowerCase();
            this.renderGrid();
        });

        // I is the sole inventory shortcut; Tab retains normal focus navigation.
        window.addEventListener('keydown', (e) => {
            if (gameKey(e) !== 'i' || e.repeat || e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
            e.preventDefault(); this.toggle();
        });
    }

    setCategory(categoryKey) {
        this.activeCategory = categoryKey;
        this.tabsContainer.querySelectorAll('.inv-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === categoryKey);
        });
        this.renderGrid();
    }

    getItemPresentation(item) {
        if (item.cookieSet) return cookiePresentation(item);
        if (item.category !== 'intel' || !item.targetStockId) return item;
        const decoded = rumorDecryption(item.intelReport || item.desc || '', item, this.callbacks.getAnalysisLevel?.() ?? 1);
        const detailed = item.isRead && decoded.level === 5;
        return {
            ...item,
            // Titles can contain both the company and the catalyst; use a neutral label.
            name: detailed ? item.name : '익명의 찌라시',
            desc: item.isRead ? decoded.text : '봉인된 익명 제보입니다. 열람하면 현재 분석력에 맞는 소문을 읽을 수 있습니다.',
            effects: detailed ? item.effects : [`분석 LV ${decoded.level} · ${item.isRead ? '소문의 단서를 직접 이어 보세요.' : '내용은 열람 후 확인할 수 있습니다.'}`]
        };
    }

    getFilteredItems() {
        return this.items.filter(item => {
            if (item.category === 'apparel' || (this.giftMode && !this.giftMode.eligible(item))) return false;
            const matchesCat = this.activeCategory === 'all' || item.category === this.activeCategory;
            const visible = this.getItemPresentation(item);
            const matchesSearch = !this.searchQuery ||
                visible.name.toLowerCase().includes(this.searchQuery) ||
                visible.desc.toLowerCase().includes(this.searchQuery);
            return matchesCat && matchesSearch;
        });
    }

    renderGrid() {
        const filtered = this.getFilteredItems();
        this.updateCapacityBadge();

        let gridHtml = '';
        filtered.forEach(item => {
            const visible = this.getItemPresentation(item);
            const isSelected = item.id === this.selectedItemId;
            gridHtml += `
                <div class="inv-slot ${isSelected ? 'active' : ''}" data-category="${item.category}" data-id="${item.id}" data-rarity="${item.rarity}" title="${visible.name}">
                    <span class="inv-item-icon">${itemIconHtml(item)}</span>
                    ${item.cookieSet ? `<span class="inv-qty-badge">${item.quantity}세트 · ${item.openedRemaining}/4개</span>` : item.quantity > 1 ? `<span class="inv-qty-badge">x${item.quantity}</span>` : ''}
                    ${item.isEquipped ? `<span class="inv-equipped-badge">장착</span>` : ''}
                </div>
            `;
        });

        // Fill remaining visual empty slots up to maxSlots (or at least 15)
        const emptyCount = Math.max(0, Math.min(this.maxSlots - filtered.length, 20 - filtered.length));
        for (let i = 0; i < emptyCount; i++) {
            gridHtml += `<div class="inv-slot empty"></div>`;
        }

        this.gridContainer.innerHTML = gridHtml;

        // Slot click listeners
        this.gridContainer.querySelectorAll('.inv-slot:not(.empty)').forEach(slot => {
            slot.addEventListener('click', () => {
                const id = slot.dataset.id;
                this.selectItem(id);
            });
        });

        // If selected item is not in filtered list, select first available
        if (filtered.length > 0 && !filtered.some(i => i.id === this.selectedItemId)) {
            this.selectItem(filtered[0].id);
        } else if (filtered.length === 0) {
            this.renderDetail(null);
        } else {
            this.renderDetail(this.items.find(i => i.id === this.selectedItemId));
        }
    }

    selectItem(itemId) {
        this.selectedItemId = itemId;
        this.gridContainer.querySelectorAll('.inv-slot').forEach(slot => {
            slot.classList.toggle('active', slot.dataset.id === itemId);
        });
        const item = this.items.find(i => i.id === itemId);
        this.renderDetail(item);
    }

    renderDetail(item) { renderInventoryDetail.call(this, item); }

    handleItemAction(item) {
        if (!item || item.category === 'apparel') return;
        if (item.id === 'item_crypto_decoder' || item.id === 'item_moon_powder') {
            this.openDecoderPicker(item.id);
            return;
        }
        if (this.callbacks.onActivateItem?.(item) === true) {
            this.renderGrid();
            return;
        }
        if (item.actionType === 'inspect') {
            this.callbacks.onShowToast?.(item.desc, true);
            return;
        }
        if (item.category === 'consumable') {
            this.useConsumable(item);
        } else if (item.category === 'furniture') {
            if (this.callbacks.onShowToast) {
                this.callbacks.onShowToast(`🛋️ [${item.name}] 오피스 가구 배치 모드로 전환합니다.`);
            }
        } else if (item.category === 'intel') {
            this.rumorPopup?.open(item, (_updatedItem, info) => {
                this.renderGrid();
                const visible = this.getItemPresentation(item);
                if (this.callbacks.onShowToast) {
                    if (info.isFirstRead) {
                        this.callbacks.onShowToast(`📜 [${visible.name}] 최초 열람 완료! (가치 하락: ${info.previousPrice.toLocaleString()}G ➔ ${info.newPrice.toLocaleString()}G)`, true);
                    } else {
                        this.callbacks.onShowToast(`📜 [${visible.name}] 찌라시 정보 재확인 (가치 유지: ${item.price.toLocaleString()}G)`);
                    }
                }
            });
        } else if (item.category === 'book') {
            if (this.callbacks.onShowToast) {
                this.callbacks.onShowToast(`📖 [${item.name}] 열람: "${item.effects?.[0] || item.desc}"`);
            }
        }
    }

    openDecoderPicker(powderId = 'item_crypto_decoder') {
        this.decoderDialog?.remove();
        const dialog = document.createElement('dialog');
        this.decoderDialog = dialog;
        dialog.className = 'rumor-decoder-picker';
        dialog.innerHTML = '<h3>해석할 찌라시 선택</h3><p>한 건을 선택하면 가루 1개를 사용해 해당 찌라시를 해석합니다.</p><div class="rumor-decoder-targets"></div><p role="status"></p><button type="button" class="inv-btn-secondary">취소</button>';
        const list = dialog.querySelector('.rumor-decoder-targets');
        const targets = this.callbacks.getDecoderTargets?.() ?? [];
        targets.forEach((item, index) => {
            const visible = this.getItemPresentation(item);
            const decoded = rumorDecryption(item.intelReport || item.desc || '', item, this.callbacks.getAnalysisLevel?.() ?? 1);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'rumor-decoder-option';
            const title = document.createElement('strong');
            title.textContent = `${index + 1}. ${visible.name} · 해석 ${decoded.level} → ${powderId === 'item_moon_powder' ? 'MAX' : decoded.level + 1}`;
            const preview = document.createElement('span');
            preview.textContent = decoded.text;
            button.append(title, preview);
            button.onclick = () => {
                const result = this.callbacks.decodeRumor?.(item.id, powderId);
                if (!result?.success) {
                    dialog.querySelector('[role=status]').textContent = result?.message || '가루를 사용할 수 없습니다.';
                    return;
                }
                dialog.close();
                this.callbacks.onShowToast?.(result.message, true);
                this.rumorPopup.open(item, () => this.renderGrid());
            };
            list.append(button);
        });
        if (!targets.length) dialog.querySelector('[role=status]').textContent = '해석 가능한 찌라시가 없습니다. 찌라시를 먼저 열람하세요. 최대 단계의 정보는 목록에서 제외됩니다.';
        dialog.querySelector('.inv-btn-secondary').onclick = () => dialog.close();
        dialog.addEventListener('keydown', event => event.stopPropagation());
        dialog.addEventListener('close', () => dialog.remove(), { once: true });
        document.body.append(dialog);
        dialog.showModal();
    }

    useConsumable(item) {
        if (this.callbacks.onUseConsumable) {
            if (this.callbacks.onUseConsumable(item) === false) return;
        } else {
            this.callbacks.onShowToast?.('이 아이템은 아직 사용할 수 없습니다.', false);
            return;
        }

        // A set remains in the bag until its last cookie is eaten.
        if (item.cookieSet) {
            eatCookie(this.items);
            this.renderGrid();
            return;
        }
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            this.items = this.items.filter(i => i.id !== item.id);
            this.selectedItemId = this.items[0]?.id || null;
        }

        this.renderGrid();
    }

    discardItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        if (confirm(`'${item.name}'을(를) 정말로 버리시겠습니까?`)) {
            this.items = this.items.filter(i => i.id !== itemId);
            this.selectedItemId = this.items[0]?.id || null;
            if (this.callbacks.onShowToast) {
                this.callbacks.onShowToast(`🗑️ [${item.name}] 아이템을 버렸습니다.`);
            }
            this.renderGrid();
        }
    }

    addItem(newItem) {
        const existing = this.items.find(i => i.id === newItem.id);
        if (existing && existing.maxStack > 1) {
            existing.quantity = Math.min(existing.maxStack, existing.quantity + (newItem.quantity || 1));
        } else {
            this.items.push({ ...newItem, quantity: newItem.quantity || 1 });
        }
        this.renderGrid();
    }

    updateCapacityBadge() {
        if (this.capacityBadge) {
            const count = this.items.filter(i => i.category !== 'apparel').length;
            this.capacityBadge.textContent = `보관함 ${count} / ${this.maxSlots}`;
        }
    }

    open() {
        this.modal.classList.remove('hidden');
        document.body.classList.add('modal-active');
        this.renderGrid();
        if (this.callbacks.onOpen) this.callbacks.onOpen();
    }

    openGift(player,options){
        if(this.giftMode)this.close();
        this.giftMode={...options,player};this.activeCategory='all';this.searchQuery='';this.searchInput.value='';
        this.tabsContainer.querySelectorAll('.inv-tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat==='all'));
        const title=this.modal.querySelector('.inventory-title-text');this.normalTitleHtml=title.innerHTML;title.textContent=`${player.name||player.nickname}님에게 선물하기`;
        const host=document.createElement('dialog');host.className='inventory-gift-host';host.setAttribute('aria-label','선물 인벤토리');host.style.cssText='position:fixed;inset:0;margin:0;padding:0;border:0;max-width:none;max-height:none;width:100vw;height:100dvh;background:transparent';
        host.addEventListener('cancel',e=>{e.preventDefault();if(!this.rumorPopup.modal.classList.contains('hidden'))this.rumorPopup.close();else this.close();});host.addEventListener('keydown',e=>e.stopPropagation());
        document.body.append(host);host.append(this.modal,this.rumorPopup.modal);this.giftHost=host;host.showModal();this.open();
    }

    close() {
        this.modal.classList.add('hidden');
        if(this.giftHost){
            this.rumorPopup.close();this.container.append(this.modal,this.rumorPopup.modal);
            this.giftHost.close();this.giftHost.remove();this.giftHost=null;this.giftMode=null;
            this.modal.querySelector('.inventory-title-text').innerHTML=this.normalTitleHtml;
        }
        document.body.classList.remove('modal-active');
        if (this.callbacks.onClose) this.callbacks.onClose();
    }

    toggle() {
        if (this.modal.classList.contains('hidden')) {
            this.open();
        } else {
            this.close();
        }
    }
}
