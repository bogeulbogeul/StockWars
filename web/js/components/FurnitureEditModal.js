/**
 * FurnitureEditModal Component
 * Unity equivalent: UIFurnitureEditor.cs / OfficeHousingKernel.cs
 * Dedicated 8x8 Office Customizer & Furniture Placement Mode.
 */

import { FURNITURE_CATEGORIES, FURNITURE_THEMES, DEFAULT_FURNITURE_CATALOG } from '../data/furnitureData.js';

export class FurnitureEditModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.furnitureList = JSON.parse(JSON.stringify(DEFAULT_FURNITURE_CATALOG));
        this.gridSize = 8;
        this.activeCategory = 'all';
        this.selectedFurnitureId = this.furnitureList[0]?.id || null;

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const categoryTabsHtml = Object.values(FURNITURE_CATEGORIES).map(cat => `
            <button class="furn-tab-btn ${cat.key === this.activeCategory ? 'active' : ''}" data-cat="${cat.key}">
                <span>${cat.icon}</span> <span>${cat.name}</span>
            </button>
        `).join('');

        const html = `
            <div id="furnitureEditModal" class="modal-overlay hidden">
                <div class="modal-card furniture-edit-card">
                    <!-- Header Toolbar -->
                    <div class="furn-edit-header">
                        <div class="furn-edit-title-group">
                            <span class="furn-edit-icon">🛠️</span>
                            <span class="furn-edit-title">오피스 인테리어 & 가구 편집</span>
                        </div>
                        <div class="furn-edit-stats">
                            <span class="furn-stat-badge" id="furnOccupancyBadge">점유 타일: 11 / 64 (17.2%)</span>
                        </div>
                        <div class="furn-actions-top">
                            <button class="furn-tool-btn" id="btnFurnRotate" title="선택 가구 90도 회전 (R)">
                                <span>🔄</span> <span>90° 회전</span>
                            </button>
                            <button class="furn-tool-btn" id="btnFurnClearAll" title="모든 가구 보관함으로 회수">
                                <span>🧹</span> <span>전체 수납</span>
                            </button>
                            <button class="furn-tool-btn primary" id="btnFurnSaveClose" title="배치 저장 및 완료 (ESC)">
                                <span>💾</span> <span>배치 완료</span>
                            </button>
                        </div>
                    </div>

                    <!-- Main Workspace -->
                    <div class="furn-edit-workspace">
                        <!-- Left: 8x8 Room Canvas -->
                        <div class="furn-room-canvas-section">
                            <div class="furn-grid-board-wrapper">
                                <div class="furn-8x8-grid" id="furn8x8Grid">
                                    <!-- 64 tiles dynamically created -->
                                </div>
                            </div>
                            <div class="furn-grid-legend">
                                <div class="legend-item">
                                    <div class="legend-color" style="background: rgba(0, 229, 255, 0.4)"></div>
                                    <span>배치된 가구</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color" style="background: rgba(255, 214, 0, 0.5)"></div>
                                    <span>선택된 영역</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color" style="background: rgba(255, 255, 255, 0.05)"></div>
                                    <span>빈 바닥 (8x8)</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Furniture Drawer & Catalog -->
                        <div class="furn-catalog-section">
                            <div class="furn-catalog-tabs" id="furnTabsContainer">
                                ${categoryTabsHtml}
                            </div>
                            <div class="furn-items-list" id="furnItemsList">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modal = document.getElementById('furnitureEditModal');
        this.occupancyBadge = document.getElementById('furnOccupancyBadge');
        this.btnRotate = document.getElementById('btnFurnRotate');
        this.btnClearAll = document.getElementById('btnFurnClearAll');
        this.btnSaveClose = document.getElementById('btnFurnSaveClose');
        this.gridContainer = document.getElementById('furn8x8Grid');
        this.tabsContainer = document.getElementById('furnTabsContainer');
        this.itemsList = document.getElementById('furnItemsList');
    }

    initEventListeners() {
        this.btnSaveClose?.addEventListener('click', () => this.close());
        this.btnRotate?.addEventListener('click', () => this.rotateSelectedFurniture());
        this.btnClearAll?.addEventListener('click', () => this.clearAllFurniture());

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Category filter
        this.tabsContainer?.addEventListener('click', (e) => {
            const btn = e.target.closest('.furn-tab-btn');
            if (!btn) return;
            this.setCategory(btn.dataset.cat);
        });

        // Global hotkey: ESC to close, R to rotate
        window.addEventListener('keydown', (e) => {
            if (this.modal.classList.contains('hidden')) return;
            if (e.key === 'Escape') {
                this.close();
            } else if (e.key === 'r' || e.key === 'R') {
                this.rotateSelectedFurniture();
            }
        });
    }

    setCategory(categoryKey) {
        this.activeCategory = categoryKey;
        this.tabsContainer.querySelectorAll('.furn-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === categoryKey);
        });
        this.renderCatalog();
    }

    renderGrid() {
        let gridHtml = '';
        const placedItems = this.furnitureList.filter(f => f.placed);

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                // Check which furniture covers tile (x, y)
                const occupyingItem = placedItems.find(item => {
                    const w = item.rotation === 90 || item.rotation === 270 ? item.sizeH : item.sizeW;
                    const h = item.rotation === 90 || item.rotation === 270 ? item.sizeW : item.sizeH;
                    return x >= item.gridX && x < item.gridX + w &&
                           y >= item.gridY && y < item.gridY + h;
                });

                const isOccupied = !!occupyingItem;
                const isSelected = occupyingItem && occupyingItem.id === this.selectedFurnitureId;
                const isOrigin = occupyingItem && occupyingItem.gridX === x && occupyingItem.gridY === y;

                gridHtml += `
                    <div class="furn-tile ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}" 
                         data-x="${x}" data-y="${y}" 
                         data-item-id="${occupyingItem ? occupyingItem.id : ''}"
                         title="${occupyingItem ? `${occupyingItem.name} (${occupyingItem.sizeW}x${occupyingItem.sizeH})` : `타일 (${x}, ${y})`}">
                        ${isOrigin ? `<span class="furn-tile-token">${occupyingItem.icon}</span>` : ''}
                    </div>
                `;
            }
        }

        this.gridContainer.innerHTML = gridHtml;

        // Tile click event handlers (place or pick)
        this.gridContainer.querySelectorAll('.furn-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const x = parseInt(tile.dataset.x, 10);
                const y = parseInt(tile.dataset.y, 10);
                const itemId = tile.dataset.itemId;

                if (itemId) {
                    this.selectFurniture(itemId);
                } else if (this.selectedFurnitureId) {
                    this.placeFurnitureAt(this.selectedFurnitureId, x, y);
                }
            });
        });

        this.updateStats();
    }

    renderCatalog() {
        const filtered = this.furnitureList.filter(f => 
            this.activeCategory === 'all' || f.category === this.activeCategory
        );

        let listHtml = '';
        filtered.forEach(item => {
            const isSelected = item.id === this.selectedFurnitureId;
            const theme = FURNITURE_THEMES[item.theme] || { name: '기본', color: '#00e5ff' };

            listHtml += `
                <div class="furn-item-card ${isSelected ? 'selected' : ''}" data-id="${item.id}">
                    <div class="furn-card-icon">${item.icon}</div>
                    <div class="furn-card-info">
                        <div class="furn-card-name">${item.name}</div>
                        <div class="furn-card-tags">
                            <span class="furn-size-tag">${item.sizeW}x${item.sizeH}</span>
                            <span class="furn-status-tag ${item.placed ? 'placed' : 'stored'}">
                                ${item.placed ? '배치중' : '보관중'}
                            </span>
                        </div>
                    </div>
                    <button class="furn-card-action-btn ${item.placed ? 'stored-btn' : ''}" data-action="${item.placed ? 'store' : 'select'}">
                        ${item.placed ? '수납' : '배치'}
                    </button>
                </div>
            `;
        });

        this.itemsList.innerHTML = listHtml;

        // Card listeners
        this.itemsList.querySelectorAll('.furn-item-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const id = card.dataset.id;
                const actionBtn = e.target.closest('.furn-card-action-btn');
                if (actionBtn && actionBtn.dataset.action === 'store') {
                    this.storeFurniture(id);
                } else {
                    this.selectFurniture(id);
                }
            });
        });
    }

    selectFurniture(furnitureId) {
        this.selectedFurnitureId = furnitureId;
        this.renderGrid();
        this.renderCatalog();
    }

    rotateSelectedFurniture() {
        const item = this.furnitureList.find(f => f.id === this.selectedFurnitureId);
        if (!item) return;

        item.rotation = (item.rotation + 90) % 360;
        if (this.callbacks.onShowToast) {
            this.callbacks.onShowToast(`🔄 [${item.name}] 회전: ${item.rotation}°`);
        }
        this.renderGrid();
    }

    placeFurnitureAt(furnitureId, targetX, targetY) {
        const item = this.furnitureList.find(f => f.id === furnitureId);
        if (!item) return;

        const w = item.rotation === 90 || item.rotation === 270 ? item.sizeH : item.sizeW;
        const h = item.rotation === 90 || item.rotation === 270 ? item.sizeW : item.sizeH;

        if (targetX + w > this.gridSize || targetY + h > this.gridSize) {
            if (this.callbacks.onShowToast) {
                this.callbacks.onShowToast('⚠️ 오피스 8x8 경계를 벗어납니다!', false);
            }
            return;
        }

        item.placed = true;
        item.gridX = targetX;
        item.gridY = targetY;

        if (this.callbacks.onShowToast) {
            this.callbacks.onShowToast(`🛋️ [${item.name}] (${targetX}, ${targetY}) 위치에 배치 완료!`, true);
        }

        this.renderGrid();
        this.renderCatalog();
    }

    storeFurniture(furnitureId) {
        const item = this.furnitureList.find(f => f.id === furnitureId);
        if (!item) return;

        item.placed = false;
        item.gridX = null;
        item.gridY = null;

        if (this.callbacks.onShowToast) {
            this.callbacks.onShowToast(`📦 [${item.name}] 가구를 보관함으로 수납했습니다.`);
        }

        this.renderGrid();
        this.renderCatalog();
    }

    clearAllFurniture() {
        this.furnitureList.forEach(f => {
            f.placed = false;
            f.gridX = null;
            f.gridY = null;
        });
        if (this.callbacks.onShowToast) {
            this.callbacks.onShowToast('🧹 모든 오피스 가구를 수납했습니다.');
        }
        this.renderGrid();
        this.renderCatalog();
    }

    updateStats() {
        const placed = this.furnitureList.filter(f => f.placed);
        let occupiedTiles = 0;
        placed.forEach(item => {
            occupiedTiles += (item.sizeW * item.sizeH);
        });

        const pct = ((occupiedTiles / 64) * 100).toFixed(1);
        if (this.occupancyBadge) {
            this.occupancyBadge.textContent = `점유 타일: ${occupiedTiles} / 64 (${pct}%) • 가구 ${placed.length}개`;
        }
    }

    open() {
        this.modal.classList.remove('hidden');
        this.renderGrid();
        this.renderCatalog();
    }

    close() {
        this.modal.classList.add('hidden');
        if (this.callbacks.onSaveLayout) {
            this.callbacks.onSaveLayout(this.furnitureList);
        }
    }

    toggle() {
        if (this.modal.classList.contains('hidden')) {
            this.open();
        } else {
            this.close();
        }
    }
}
