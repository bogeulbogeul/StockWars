/**
 * WardrobeModal Component
 * Dedicated Wardrobe & Dressing Room Modal for checking and equipping player apparel/costumes.
 * Triggered from Wardrobe Furniture in Office / FurnitureEditModal.
 */

import { ITEM_CATALOG_DB } from '../data/inventoryData.js';
import { itemIconHtml } from '../data/itemArtwork.js';

export class WardrobeModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks || {};
        this.apparelItems = [];
        this.selectedItemId = null;

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="wardrobeModal" class="modal-overlay hidden">
                <div class="modal-card wardrobe-card">
                    <!-- Header -->
                    <div class="wardrobe-header">
                        <div class="wardrobe-title-group">
                            <span class="wardrobe-header-icon">👗</span>
                            <span class="wardrobe-title-text">드레스룸 & 보유 옷장</span>
                        </div>
                        <button class="wardrobe-close-btn" id="btnCloseWardrobe" title="닫기 (ESC)">✕</button>
                    </div>

                    <!-- Main Body Split -->
                    <div class="wardrobe-body">
                        <!-- Left: Apparel Items Grid -->
                        <div class="wardrobe-grid-section">
                            <div class="wardrobe-equipped-bar" id="wardrobeEquippedBar">
                                <!-- Equipped summary badges -->
                            </div>
                            <div class="wardrobe-grid" id="wardrobeGridContainer">
                                <!-- Populated dynamically -->
                            </div>
                        </div>

                        <!-- Right: Apparel Detail & Fitting Panel -->
                        <div class="wardrobe-detail-section" id="wardrobeDetailContainer">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modal = document.getElementById('wardrobeModal');
        this.btnClose = document.getElementById('btnCloseWardrobe');
        this.equippedBar = document.getElementById('wardrobeEquippedBar');
        this.gridContainer = document.getElementById('wardrobeGridContainer');
        this.detailContainer = document.getElementById('wardrobeDetailContainer');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    loadApparelItems(inventoryItems = []) {
        // Extract apparel category items from inventory or catalog DB
        const catalogApparel = ITEM_CATALOG_DB.filter(i => i.category === 'apparel');
        
        // Merge with player inventory state if provided
        this.apparelItems = catalogApparel.map(catItem => {
            const invMatch = inventoryItems.find(i => i.id === catItem.id);
            return {
                ...catItem,
                isEquipped: invMatch ? !!invMatch.isEquipped : false,
                isOwned: true // Available in wardrobe
            };
        });

        if (!this.selectedItemId && this.apparelItems.length > 0) {
            this.selectedItemId = this.apparelItems[0].id;
        }
    }

    renderGrid() {
        if (!this.gridContainer) return;

        // Render equipped bar summary
        const equippedList = this.apparelItems.filter(i => i.isEquipped);
        if (equippedList.length > 0) {
            this.equippedBar.innerHTML = `
                <span class="equipped-label">✨ 현재 장착 중:</span>
                ${equippedList.map(item => `<span class="equipped-chip">${item.icon} ${item.name}</span>`).join('')}
            `;
        } else {
            this.equippedBar.innerHTML = `<span class="equipped-label empty">👕 착용 중인 전용 의상이 없습니다.</span>`;
        }

        let gridHtml = '';
        this.apparelItems.forEach(item => {
            const isSelected = item.id === this.selectedItemId;
            gridHtml += `
                <div class="wardrobe-slot ${isSelected ? 'active' : ''} ${item.isEquipped ? 'equipped' : ''}" data-id="${item.id}" data-rarity="${item.rarity || 'common'}">
                    <span class="wardrobe-item-icon">${itemIconHtml(item)}</span>
                    ${item.isEquipped ? `<span class="wardrobe-badge-equipped">장착</span>` : ''}
                    <span class="wardrobe-item-name-sm">${item.name}</span>
                </div>
            `;
        });

        this.gridContainer.innerHTML = gridHtml;

        this.gridContainer.querySelectorAll('.wardrobe-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                this.selectedItemId = slot.dataset.id;
                this.renderGrid();
                this.renderDetail();
            });
        });

        this.renderDetail();
    }

    renderDetail() {
        if (!this.detailContainer) return;

        const item = this.apparelItems.find(i => i.id === this.selectedItemId);
        if (!item) {
            this.detailContainer.innerHTML = `<div class="wardrobe-empty-detail">보유한 의상을 선택하세요.</div>`;
            return;
        }

        const effectsHtml = (item.effects || []).map(eff => `<li>${eff}</li>`).join('');

        this.detailContainer.innerHTML = `
            <div class="wardrobe-detail-card" data-rarity="${item.rarity || 'common'}">
                <div class="wardrobe-detail-header">
                    <div class="wardrobe-detail-preview">
                        <span class="wardrobe-big-icon">${itemIconHtml(item)}</span>
                    </div>
                    <div class="wardrobe-detail-meta">
                        <span class="wardrobe-rarity-pill ${item.rarity || 'common'}">${item.rarity || '일반'}</span>
                        <h3 class="wardrobe-detail-title">${item.name}</h3>
                        <span class="wardrobe-category-tag">👗 의상 & 액세서리</span>
                    </div>
                </div>

                <div class="wardrobe-detail-desc">${item.desc}</div>

                ${effectsHtml ? `
                    <div class="wardrobe-detail-effects">
                        <h4>✨ 착용 효과 & 버프</h4>
                        <ul>${effectsHtml}</ul>
                    </div>
                ` : ''}

                <div class="wardrobe-detail-actions">
                    <button class="wardrobe-equip-btn ${item.isEquipped ? 'unequip' : 'equip'}" id="btnWardrobeToggleEquip">
                        ${item.isEquipped ? '👔 장착 해제하기' : '👗 옷장에서 착용하기'}
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btnWardrobeToggleEquip')?.addEventListener('click', () => {
            this.toggleEquip(item.id);
        });
    }

    toggleEquip(itemId) {
        const item = this.apparelItems.find(i => i.id === itemId);
        if (!item) return;

        item.isEquipped = !item.isEquipped;
        
        const msg = item.isEquipped ? `👗 [${item.name}] 착용 완료!` : `👔 [${item.name}] 장착 해제되었습니다.`;
        if (this.callbacks.onShowToast) this.callbacks.onShowToast(msg, true);
        if (this.callbacks.onEquipChange) this.callbacks.onEquipChange(item);

        this.renderGrid();
    }

    open(inventoryItems = []) {
        this.loadApparelItems(inventoryItems);
        this.modal?.classList.remove('hidden');
        document.body.classList.add('modal-active');
        this.renderGrid();
    }

    close() {
        this.modal?.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }
}
