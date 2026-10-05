/**
 * FurnitureEditModal Component
 * Unity equivalent: UIFurnitureEditor.cs / OfficeHousingKernel.cs
 * Dedicated 8x8 Office Customizer & Furniture Placement Mode.
 */

import { FURNITURE_CATEGORIES, FURNITURE_THEMES, DEFAULT_FURNITURE_CATALOG } from '../data/furnitureData.js?v=office-openings-v8';
import { OFFICE_GRID, officeGridToScreen } from './office/OfficeGrid.js';
import { officeWallHeight } from './office/OfficeOpeningSizing.js?v=window-grid-v1';

export class FurnitureEditModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.furnitureList = JSON.parse(JSON.stringify(DEFAULT_FURNITURE_CATALOG));
        this.gridSize = 8;
        this.activeCategory = 'all';
        this.selectedFurnitureId = this.furnitureList[0]?.id || null;
        this.history = [];
        try {
            const saved = JSON.parse(localStorage.getItem('stockwars.officeLayout') || 'null');
            if (Array.isArray(saved)) {
                this.furnitureList.forEach(item => {
                    if (saved.some(entry => entry.id === item.id)) { item.placed = false; item.gridX = null; item.gridY = null; }
                });
                this.furnitureList.forEach(item => {
                    const state = saved.find(entry => entry.id === item.id);
                    if (!state || ![0, 90, 180, 270].includes(state.rotation) || (item.canRotate === false && state.rotation !== 0)) return;
                    const candidate = { ...item, rotation: state.rotation };
                    if (state.placed && this.canPlace(candidate, state.gridX, state.gridY)) {
                        Object.assign(item, { placed: true, rotation: state.rotation, gridX: state.gridX, gridY: state.gridY });
                        if (item.wallFixture) item.wallHeight = officeWallHeight(item, state.wallHeight);
                    } else if (!state.placed) Object.assign(item, { placed: false, rotation: state.rotation, gridX: null, gridY: null });
                });
            }
        } catch { /* Unavailable or invalid storage: use the default room. */ }

        this.render();
        this.initDOM();
        this.initEventListeners();
        this.renderGrid();
    }

    render() {
        const categoryTabsHtml = Object.values(FURNITURE_CATEGORIES).map(cat => `
            <button class="furn-tab-btn ${cat.key === this.activeCategory ? 'active' : ''}" data-cat="${cat.key}">
                <span>${cat.icon}</span> <span>${cat.name}</span>
            </button>
        `).join('');

        const html = `
            <div id="furnitureEditModal" class="furniture-editor-sidebar hidden">
                <div class="modal-card furniture-edit-card" role="dialog" aria-modal="false" aria-label="홈오피스 가구 편집">
                    <!-- Header Toolbar -->
                    <div class="furn-edit-header">
                        <div class="furn-edit-title-group">
                            <span class="furn-edit-icon">🛠️</span>
                            <span class="furn-edit-title">홈오피스 <small>가구 편집 모드</small></span>
                        </div>
                        <div class="furn-edit-stats">
                            <span class="furn-stat-badge" id="furnOccupancyBadge">점유 타일: 11 / 64 (17.2%)</span>
                        </div>
                        <div class="furn-actions-top">
                            <button class="furn-tool-btn" id="btnFurnDefaultLayout">기본 배치</button>
                            <button class="furn-tool-btn" id="btnFurnUndo">↶ 되돌리기</button>
                            <button class="furn-tool-btn" id="btnFurnCancel">취소</button>
                            <button class="furn-tool-btn" id="btnFurnRotate" title="선택 가구 90도 회전 (R)">
                                <span>🔄</span> <span>90° 회전</span>
                            </button>
                            <button class="furn-tool-btn" id="btnFurnClearAll" title="모든 가구 보관함으로 회수">
                                <span>🧹</span> <span>전체 수납</span>
                            </button>
                            <button class="furn-tool-btn primary" id="btnFurnSaveClose" title="배치 저장 및 완료">
                                <span>💾</span> <span>배치 완료</span>
                            </button>
                        </div>
                    </div>

                    <!-- Main Workspace -->
                    <div class="furn-edit-workspace">
                        <!-- Right: Furniture Drawer & Catalog -->
                        <div class="furn-catalog-section">
                            <div class="furn-library-heading"><strong>보유 가구</strong><span>선택 · 이동 · 수납</span></div>
                            <div class="furn-category-navigation">
                                <button type="button" class="furn-category-scroll" id="btnFurnCategoryPrev" aria-label="이전 가구 카테고리" aria-controls="furnTabsContainer">‹</button>
                                <div class="furn-catalog-tabs" id="furnTabsContainer" aria-label="가구 카테고리">
                                    ${categoryTabsHtml}
                                </div>
                                <button type="button" class="furn-category-scroll" id="btnFurnCategoryNext" aria-label="다음 가구 카테고리" aria-controls="furnTabsContainer">›</button>
                            </div>
                            <div class="furn-items-list" id="furnItemsList">
                                <!-- Populated dynamically -->
                            </div>
                            <div class="furn-selection-detail" id="furnSelectionDetail" aria-live="polite"></div>
                        </div>
                    </div>
                    <div class="furn-edit-footer"><span id="furnEditStatus" role="status">배치할 가구를 선택하세요.</span><span><kbd>R</kbd> 회전 · <kbd>Esc</kbd> 취소</span></div>
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
        this.gridContainer = document.getElementById('isoFloorTilesGroup');
        this.stage = this.callbacks.stage;
        this.tabsContainer = document.getElementById('furnTabsContainer');
        this.categoryPrev = this.modal.querySelector('#btnFurnCategoryPrev');
        this.categoryNext = this.modal.querySelector('#btnFurnCategoryNext');
        this.itemsList = document.getElementById('furnItemsList');
    }

    initEventListeners() {
        const svg = this.stage.svgStage;
        svg.addEventListener('pointerdown', e => this.startDrag(e));
        svg.addEventListener('pointermove', e => this.moveDrag(e));
        svg.addEventListener('pointerup', e => this.finishDrag(e));
        svg.addEventListener('pointercancel', () => this.abortDrag());
        svg.addEventListener('lostpointercapture', () => this.abortDrag());
        svg.addEventListener('click', e => {
            if (this.modal.classList.contains('hidden')) return;
            if (this.suppressDragClick || e.target.closest('[data-furniture-id]')) {
                this.suppressDragClick = false;
                e.stopImmediatePropagation();
            }
        }, true);
        const scrollCategories = direction => this.tabsContainer.scrollBy({
            left: direction * this.tabsContainer.clientWidth * 0.75,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
        });
        this.categoryPrev.addEventListener('click', () => scrollCategories(-1));
        this.categoryNext.addEventListener('click', () => scrollCategories(1));
        this.tabsContainer.addEventListener('scroll', () => this.updateCategoryScroll());
        this.tabsContainer.addEventListener('wheel', e => {
            if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
            const maxScroll = this.tabsContainer.scrollWidth - this.tabsContainer.clientWidth;
            if (maxScroll <= 0 || (e.deltaY < 0 && this.tabsContainer.scrollLeft <= 0) || (e.deltaY > 0 && this.tabsContainer.scrollLeft >= maxScroll - 1)) return;
            e.preventDefault();
            const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.tabsContainer.clientWidth : 1);
            this.tabsContainer.scrollLeft += delta;
        }, { passive: false });
        this.categoryResizeObserver = new ResizeObserver(() => this.updateCategoryScroll());
        this.categoryResizeObserver.observe(this.tabsContainer);
        this.modal.querySelector('#btnFurnCancel').addEventListener('click', () => this.cancel());
        this.modal.querySelector('#btnFurnUndo').addEventListener('click', () => this.undo());
        this.modal.querySelector('#btnFurnDefaultLayout').addEventListener('click', () => {
            this.remember();
            this.furnitureList = JSON.parse(JSON.stringify(DEFAULT_FURNITURE_CATALOG));
            this.renderGrid(); this.renderCatalog();
            this.setStatus('기본 가구를 격자 기준으로 정리했습니다. 배치 완료를 눌러 저장하세요.');
        });
        this.gridContainer.addEventListener('pointerover', e => {
            const tile = e.target.closest('.iso-floor-tile');
            if (tile && !this.modal.classList.contains('hidden')) this.previewAt(Number(tile.dataset.gx), Number(tile.dataset.gy));
        });
        this.gridContainer.addEventListener('pointerleave', () => this.clearPreview());
        this.btnSaveClose?.addEventListener('click', () => this.close());
        this.btnRotate?.addEventListener('click', () => this.rotateSelectedFurniture());
        this.btnClearAll?.addEventListener('click', () => this.clearAllFurniture());

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.cancel();
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
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.cancel();
            } else if (e.key === 'r' || e.key === 'R') {
                this.rotateSelectedFurniture();
            }
        });
    }

    setCategory(categoryKey) {
        this.activeCategory = categoryKey;
        this.tabsContainer.querySelectorAll('.furn-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === categoryKey);
            if (btn.dataset.cat === categoryKey) {
                const left = btn.offsetLeft - this.tabsContainer.offsetLeft;
                if (left < this.tabsContainer.scrollLeft) this.tabsContainer.scrollLeft = left;
                else if (left + btn.offsetWidth > this.tabsContainer.scrollLeft + this.tabsContainer.clientWidth) {
                    this.tabsContainer.scrollLeft = left + btn.offsetWidth - this.tabsContainer.clientWidth;
                }
            }
        });
        this.renderCatalog();
    }

    renderGrid() {
        this.stage?.renderFurniture(this.furnitureList, this.selectedFurnitureId);
        this.updateStats();
    }

    pointerGrid(e) {
        const svg = this.stage.svgStage;
        const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
        const dx = (point.x - OFFICE_GRID.x) / OFFICE_GRID.halfWidth;
        const dy = (point.y - OFFICE_GRID.y) / OFFICE_GRID.halfHeight;
        return { x: (dy - dx) / 2, y: (dy + dx) / 2 };
    }

    startDrag(e) {
        if (this.modal.classList.contains('hidden') || e.button !== 0 || this.drag) return;
        const id = e.target.closest('[data-furniture-id]')?.dataset.furnitureId;
        const item = this.furnitureList.find(f => f.id === id && f.placed);
        if (!item) return;
        e.preventDefault();
        this.suppressDragClick = false;
        this.selectFurniture(id);
        this.drag = { id, pointerId: e.pointerId, start: this.pointerGrid(e),
            clientX: e.clientX, clientY: e.clientY, x: item.gridX, y: item.gridY,
            targetX: item.gridX, targetY: item.gridY, height: officeWallHeight(item), targetHeight: officeWallHeight(item), moved: false };
        this.stage.svgStage.setPointerCapture(e.pointerId);
        this.setStatus(`${item.name} 선택 · 드래그하여 이동하세요.`);
    }

    moveDrag(e) {
        const drag = this.drag;
        if (!drag || drag.pointerId !== e.pointerId) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.clientX, e.clientY - drag.clientY) < 5) return;
        drag.moved = true;
        const point = this.pointerGrid(e);
        const item = this.furnitureList.find(f => f.id === drag.id);
        if (item.wallFixture) {
            const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(this.stage.svgStage.getScreenCTM().inverse());
            const start = officeGridToScreen(drag.start.x, drag.start.y);
            const startIndex = drag.x >= 3 ? drag.x : 6;
            drag.targetY = p.x >= 500 ? 1 : 0;
            drag.targetX = Math.max(3, Math.min(8, Math.round(startIndex + (Math.abs(p.x - 500) - Math.abs(start.x - 500)) / 33.75)));
            drag.targetHeight = officeWallHeight(item, drag.height + (drag.targetX - startIndex) * 19.1 - (p.y - start.y));
            this.stage.renderFurniture(this.furnitureList.map(f => f.id === item.id ? {...f, gridX:drag.targetX, gridY:drag.targetY, wallHeight:drag.targetHeight} : f), item.id);
            return;
        }
        drag.targetX = drag.x + Math.round(point.x - drag.start.x);
        drag.targetY = drag.y + Math.round(point.y - drag.start.y);
        this.previewAt(drag.targetX, drag.targetY);
        const delta = officeGridToScreen(drag.targetX - drag.x, drag.targetY - drag.y);
        const group = this.stage.furnitureLayer.querySelector(`[data-furniture-id="${drag.id}"]`);
        group.setAttribute('transform', `translate(${delta.x - OFFICE_GRID.x} ${delta.y - OFFICE_GRID.y})`);
        group.style.opacity = this.canPlace(item, drag.targetX, drag.targetY) ? '0.8' : '0.4';
    }

    finishDrag(e) {
        const drag = this.drag;
        if (!drag || drag.pointerId !== e.pointerId) return;
        this.moveDrag(e);
        this.drag = null;
        this.suppressDragClick = drag.moved;
        if (this.stage.svgStage.hasPointerCapture(e.pointerId)) this.stage.svgStage.releasePointerCapture(e.pointerId);
        if (drag.moved && (drag.targetX !== drag.x || drag.targetY !== drag.y || drag.targetHeight !== drag.height)) {
            this.placeFurnitureAt(drag.id, drag.targetX, drag.targetY, drag.targetHeight);
        }
        this.renderGrid();
        this.clearPreview();
    }

    abortDrag() {
        const drag = this.drag;
        if (!drag) return;
        this.drag = null;
        if (this.stage.svgStage.hasPointerCapture(drag.pointerId)) this.stage.svgStage.releasePointerCapture(drag.pointerId);
        this.renderGrid();
        this.clearPreview();
    }

    handleFloorClick(x, y) {
        if (this.furnitureList.find(item => item.id === this.selectedFurnitureId)?.wallFixture) {
            this.setStatus('벽 에셋을 직접 드래그하세요. 벽장식은 위아래 이동도 가능합니다.'); return;
        }
        const occupying = this.furnitureList.find(item => {
            if (!item.placed) return false;
            const w = item.rotation % 180 ? item.sizeH : item.sizeW;
            const h = item.rotation % 180 ? item.sizeW : item.sizeH;
            return x >= item.gridX && x < item.gridX + w && y >= item.gridY && y < item.gridY + h;
        });
        if (occupying && occupying.id !== this.selectedFurnitureId) this.selectFurniture(occupying.id);
        else if (this.selectedFurnitureId) this.placeFurnitureAt(this.selectedFurnitureId, x, y);
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
                    <div class="furn-card-icon">${item.asset ? `<img src="${item.asset.url}" alt="${item.name}" style="width:100%;height:100%;object-fit:contain;filter:${theme.displayFilter || 'none'}">` : item.icon}</div>
                    <div class="furn-card-info">
                        <div class="furn-card-name">${item.name}</div>
                        <div class="furn-card-tags">
                            <span class="furn-size-tag">${item.wallFixture ? '벽 설치' : `${item.sizeW}x${item.sizeH}`}</span>
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

        this.itemsList.innerHTML = listHtml || '<p class="furn-empty-state">등록된 가구가 없습니다.</p>';
        const selected = this.furnitureList.find(item => item.id === this.selectedFurnitureId);
        const detail = this.modal.querySelector('#furnSelectionDetail');
        const wallDescription = selected?.wallFixture === 'isoOfficeDoor' ? '벽을 따라 드래그 · 문 하단은 바닥 고정' : '벽 격자에 맞춰 드래그 · 위아래 이동 가능';
        detail.innerHTML = selected ? `<strong>${selected.icon} ${selected.name}</strong><p>${selected.wallFixture ? wallDescription : selected.desc}</p><span>${selected.wallFixture ? `벽 설치 · 높이 ${Math.round(officeWallHeight(selected) / 38.2)}단` : `${selected.sizeW} × ${selected.sizeH} 타일 · ${selected.rotation}°`} · ${FURNITURE_THEMES[selected.theme]?.name || '기본'}</span>` : '가구를 선택하세요.';
        this.btnRotate.disabled = !selected || selected.canRotate === false;
        const mirrorRotation = selected?.asset?.rotationMode === 'mirror';
        this.btnRotate.innerHTML = `<span>🔄</span> <span>${mirrorRotation ? '방향 전환' : '90° 회전'}</span>`;
        this.btnRotate.title = mirrorRotation ? '좌우 두 방향 전환 (R)' : '선택 가구 90도 회전 (R)';
        this.btnClearAll.disabled = !this.furnitureList.some(item => item.placed);

        // Card listeners
        this.itemsList.querySelectorAll('.furn-item-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const id = card.dataset.id;
                const actionBtn = e.target.closest('.furn-card-action-btn');
                if (actionBtn && actionBtn.dataset.action === 'store') {
                    this.storeFurniture(id);
                } else {
                    this.selectFurniture(id);
                    const item = this.furnitureList.find(f => f.id === id);
                    if (item.wallFixture && !item.placed) this.placeFurnitureAt(id, 0, 0);
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
        this.abortDrag();
        const item = this.furnitureList.find(f => f.id === this.selectedFurnitureId);
        if (!item) return;
        if (item.canRotate === false) {
            this.setStatus('현재 가구는 한 방향 시안입니다. 다른 방향 이미지 제작 후 회전할 수 있습니다.');
            return;
        }

        const rotation = item.asset?.rotationMode === 'mirror' ? (item.rotation === 0 ? 90 : 0) : (item.rotation + 90) % 360;
        if (item.placed && !this.canPlace({ ...item, rotation }, item.gridX, item.gridY)) {
            this.setStatus('회전할 공간이 부족합니다. 가구를 이동하거나 수납하세요.');
            return;
        }
        this.remember();
        item.rotation = rotation;
        this.setStatus(`${item.name} 방향 전환 완료 · 배치 완료를 눌러 저장하세요.`);
        if (this.callbacks.onShowToast) {
            this.callbacks.onShowToast(`🔄 [${item.name}] 회전: ${item.rotation}°`);
        }
        this.renderGrid();
        this.renderCatalog();
    }

    placeFurnitureAt(furnitureId, targetX, targetY, wallHeight) {
        const item = this.furnitureList.find(f => f.id === furnitureId);
        if (!item) return;
        if (item.wallFixture) {
            this.remember(); item.placed = true; item.gridX = Math.max(3, Math.min(8, targetX)); item.gridY = targetY === 1 ? 1 : 0;
            item.wallHeight = officeWallHeight(item, wallHeight);
            this.renderGrid(); this.renderCatalog(); this.setStatus(`${item.name}을 벽에 설치했습니다.`); return;
        }

        if (!this.canPlace(item, targetX, targetY)) {
            this.setStatus('배치 불가: 다른 가구와 겹치거나 방 경계를 벗어납니다.');
            return;
        }

        const w = item.rotation === 90 || item.rotation === 270 ? item.sizeH : item.sizeW;
        const h = item.rotation === 90 || item.rotation === 270 ? item.sizeW : item.sizeH;

        if (targetX + w > this.gridSize || targetY + h > this.gridSize) {
            if (this.callbacks.onShowToast) {
                this.callbacks.onShowToast('⚠️ 오피스 8x8 경계를 벗어납니다!', false);
            }
            return;
        }

        this.remember();
        item.placed = true;
        item.gridX = targetX;
        item.gridY = targetY;
        this.setStatus(`${item.name} 배치 완료 · 저장하면 적용됩니다.`);

        if (this.callbacks.onShowToast) {
            this.callbacks.onShowToast(`🛋️ [${item.name}] (${targetX}, ${targetY}) 위치에 배치 완료!`, true);
        }

        this.renderGrid();
        this.renderCatalog();
    }

    storeFurniture(furnitureId) {
        const item = this.furnitureList.find(f => f.id === furnitureId);
        if (!item) return;

        this.remember();

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
        this.remember();
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
        if (!this.modal.classList.contains('hidden')) return;
        this.previousFocus = document.activeElement;
        this.initialLayout = JSON.stringify(this.furnitureList);
        this.history = [];
        this.stage?.setFurnitureEditMode(true, (x, y) => this.handleFloorClick(x, y));
        document.body.classList.add('furniture-edit-active');
        this.modal.classList.remove('hidden');
        this.updateCategoryScroll();
        this.renderGrid();
        this.renderCatalog();
        this.setStatus('가구를 눌러 선택하고 드래그하여 이동 · 빈 바닥 클릭으로도 배치 가능');
        this.btnSaveClose.focus();
    }

    close() {
        this.abortDrag();
        try {
            localStorage.setItem('stockwars.officeLayout', JSON.stringify(this.furnitureList.map(({ id, placed, gridX, gridY, rotation, wallHeight }) => ({ id, placed, gridX, gridY, rotation, wallHeight }))));
        } catch {
            this.setStatus('저장 공간을 사용할 수 없습니다. 다시 시도해주세요.');
            return;
        }
        this.modal.classList.add('hidden');
        document.body.classList.remove('furniture-edit-active');
        this.stage?.setFurnitureEditMode(false);
        this.renderGrid();
        this.clearPreview();
        this.previousFocus?.focus();
        if (this.callbacks.onSaveLayout) {
            this.callbacks.onSaveLayout(this.furnitureList);
        }
    }

    toggle() {
        if (this.modal.classList.contains('hidden')) {
            this.open();
        } else {
            this.cancel();
        }
    }

    canPlace(item, x, y) {
        if (item.wallFixture) return true;
        const dimensions = value => value.rotation % 180 ? [value.sizeH, value.sizeW] : [value.sizeW, value.sizeH];
        const [w, h] = dimensions(item);
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x + w > this.gridSize || y + h > this.gridSize) return false;
        return !this.furnitureList.some(other => {
            if (!other.placed || other.wallFixture || other.id === item.id) return false;
            const [ow, oh] = dimensions(other);
            return x < other.gridX + ow && x + w > other.gridX && y < other.gridY + oh && y + h > other.gridY;
        });
    }

    updateCategoryScroll() {
        const maxScroll = this.tabsContainer.scrollWidth - this.tabsContainer.clientWidth;
        this.categoryPrev.disabled = this.tabsContainer.scrollLeft <= 1;
        this.categoryNext.disabled = this.tabsContainer.scrollLeft >= maxScroll - 1;
    }

    setStatus(message) {
        this.modal.querySelector('#furnEditStatus').textContent = message;
        this.modal.querySelector('#btnFurnUndo').disabled = !this.history.length;
    }

    remember() {
        this.history.push(JSON.stringify(this.furnitureList));
        if (this.history.length > 30) this.history.shift();
        this.setStatus('변경사항이 있습니다. 배치 완료를 눌러 저장하세요.');
    }

    undo() {
        if (!this.history.length) return;
        this.furnitureList = JSON.parse(this.history.pop());
        this.renderGrid();
        this.renderCatalog();
        this.setStatus('직전 배치를 되돌렸습니다.');
    }

    cancel() {
        this.abortDrag();
        if (this.initialLayout) this.furnitureList = JSON.parse(this.initialLayout);
        this.modal.classList.add('hidden');
        document.body.classList.remove('furniture-edit-active');
        this.stage?.setFurnitureEditMode(false);
        this.renderGrid();
        this.clearPreview();
        this.previousFocus?.focus();
    }

    clearPreview() {
        this.gridContainer.querySelectorAll('.preview-valid, .preview-invalid').forEach(tile => tile.classList.remove('preview-valid', 'preview-invalid'));
    }

    previewAt(x, y) {
        this.clearPreview();
        const item = this.furnitureList.find(f => f.id === this.selectedFurnitureId);
        if (!item || item.wallFixture) return;
        const w = item.rotation % 180 ? item.sizeH : item.sizeW;
        const h = item.rotation % 180 ? item.sizeW : item.sizeH;
        const valid = this.canPlace(item, x, y);
        this.gridContainer.querySelectorAll('.iso-floor-tile').forEach(tile => {
            const tx = Number(tile.dataset.gx), ty = Number(tile.dataset.gy);
            if (tx >= x && tx < x + w && ty >= y && ty < y + h) tile.classList.add(valid ? 'preview-valid' : 'preview-invalid');
        });
    }
}
