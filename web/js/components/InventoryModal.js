/**
 * InventoryModal Component
 * Unity equivalent: UIInventoryModal.cs / ItemStorageKernel.cs
 * Manages player bag, consumables, apparel, furniture, and documents.
 */

import { ITEM_CATEGORIES, ITEM_RARITIES, DEFAULT_INVENTORY_ITEMS } from '../data/inventoryData.js';
import { RumorPopup } from './inventory/RumorPopup.js';

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
        this.rumorPopup = new RumorPopup(this.container);
        this.initEventListeners();
    }

    render() {
        const categoryTabsHtml = Object.values(ITEM_CATEGORIES).map(cat => `
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
                            <span class="inventory-title-text">소지품 인벤토리 <span style="font-size: 11px; opacity: 0.7; font-family: var(--font-mono); background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-left: 6px;">TAB</span></span>
                        </div>
                        <div class="inventory-meta-group">
                            <span class="inventory-capacity-badge" id="invCapacityBadge">보관함 8 / 24</span>
                            <button class="inventory-close-btn" id="btnCloseInventory" title="닫기 (ESC / TAB)">✕</button>
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

        // Global hotkeys (Tab to toggle, ESC to close, I to toggle)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (!e.target.matches('input, textarea')) {
                    e.preventDefault();
                    this.toggle();
                }
            } else if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            } else if ((e.key === 'i' || e.key === 'I') && !e.target.matches('input, textarea')) {
                this.toggle();
            }
        });
    }

    setCategory(categoryKey) {
        this.activeCategory = categoryKey;
        this.tabsContainer.querySelectorAll('.inv-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === categoryKey);
        });
        this.renderGrid();
    }

    getFilteredItems() {
        return this.items.filter(item => {
            const matchesCat = this.activeCategory === 'all' || item.category === this.activeCategory;
            const matchesSearch = !this.searchQuery || 
                item.name.toLowerCase().includes(this.searchQuery) ||
                item.desc.toLowerCase().includes(this.searchQuery);
            return matchesCat && matchesSearch;
        });
    }

    renderGrid() {
        const filtered = this.getFilteredItems();
        this.updateCapacityBadge();

        let gridHtml = '';
        filtered.forEach(item => {
            const isSelected = item.id === this.selectedItemId;
            gridHtml += `
                <div class="inv-slot ${isSelected ? 'active' : ''}" data-id="${item.id}" data-rarity="${item.rarity}" title="${item.name}">
                    <span class="inv-item-icon">${item.icon}</span>
                    ${item.quantity > 1 ? `<span class="inv-qty-badge">x${item.quantity}</span>` : ''}
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

    renderDetail(item) {
        if (!item) {
            this.detailContainer.innerHTML = `
                <div class="inv-detail-empty">
                    <div class="empty-icon">🎒</div>
                    <div>선택된 아이템이 없습니다.</div>
                </div>
            `;
            return;
        }

        const rarity = ITEM_RARITIES[item.rarity] || ITEM_RARITIES.common;
        const category = ITEM_CATEGORIES[item.category] || ITEM_CATEGORIES.etc;

        let actionBtnText = item.actionLabel || '사용하기';
        let actionClass = 'inv-btn-primary';

        if (item.category === 'apparel') {
            actionBtnText = item.isEquipped ? '장착 해제' : '착용하기';
        } else if (item.category === 'intel') {
            actionBtnText = '확인하기';
        }

        const readBadgeHtml = item.isRead
            ? `<span style="font-size: 11px; color: #ff8a80; background: rgba(255,59,92,0.15); border: 1px solid rgba(255,59,92,0.3); padding: 1px 6px; border-radius: 4px; margin-left: 6px;">열람 완료</span>`
            : '';

        this.detailContainer.innerHTML = `
            <div class="inv-detail-preview">
                <div class="inv-preview-box" style="border-color: ${rarity.color}; box-shadow: 0 0 20px ${rarity.glow}">
                    <span>${item.icon}</span>
                </div>
                <div class="inv-detail-name">${item.name}</div>
                <div class="inv-detail-tags">
                    <span class="inv-rarity-tag" style="background: ${rarity.color}">${rarity.name}</span>
                    <span class="inv-category-tag">${category.icon} ${category.name}</span>
                    ${readBadgeHtml}
                </div>
            </div>

            <div class="inv-detail-desc">${item.desc}</div>

            ${item.effects && item.effects.length > 0 ? `
                <div class="inv-detail-effects">
                    ${item.effects.map(eff => `<div class="inv-effect-item">${eff}</div>`).join('')}
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
        document.getElementById('btnInvActionPrimary')?.addEventListener('click', () => {
            this.handleItemAction(item);
        });

        document.getElementById('btnInvActionDiscard')?.addEventListener('click', () => {
            this.discardItem(item.id);
        });
    }

    handleItemAction(item) {
        if (item.category === 'consumable') {
            this.useConsumable(item);
        } else if (item.category === 'apparel') {
            item.isEquipped = !item.isEquipped;
            const msg = item.isEquipped ? `👗 [${item.name}] 착용 완료!` : `👔 [${item.name}] 장착 해제되었습니다.`;
            if (this.callbacks.onShowToast) this.callbacks.onShowToast(msg, true);
            this.renderGrid();
        } else if (item.category === 'furniture') {
            if (this.callbacks.onShowToast) {
                this.callbacks.onShowToast(`🛋️ [${item.name}] 오피스 가구 배치 모드로 전환합니다.`);
            }
        } else if (item.category === 'intel') {
            this.rumorPopup?.open(item, (_updatedItem, info) => {
                this.renderGrid();
                if (this.callbacks.onShowToast) {
                    if (info.isFirstRead) {
                        this.callbacks.onShowToast(`📜 [${item.name}] 최초 열람 완료! (가치 하락: ${info.previousPrice.toLocaleString()}G ➔ ${info.newPrice.toLocaleString()}G)`, true);
                    } else {
                        this.callbacks.onShowToast(`📜 [${item.name}] 찌라시 정보 재확인 (가치 유지: ${item.price.toLocaleString()}G)`);
                    }
                }
            });
        } else if (item.category === 'book') {
            if (this.callbacks.onShowToast) {
                this.callbacks.onShowToast(`📖 [${item.name}] 열람: "${item.effects?.[0] || item.desc}"`);
            }
        }
    }

    useConsumable(item) {
        if (this.callbacks.onUseConsumable) {
            this.callbacks.onUseConsumable(item);
        }
        
        // Decrement or remove item
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
            this.capacityBadge.textContent = `보관함 ${this.items.length} / ${this.maxSlots}`;
        }
    }

    open() {
        this.modal.classList.remove('hidden');
        document.body.classList.add('modal-active');
        this.renderGrid();
        if (this.callbacks.onOpen) this.callbacks.onOpen();
    }

    close() {
        this.modal.classList.add('hidden');
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
