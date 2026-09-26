/**
 * RumorPopup Component (정보 / 찌라시 극비 열람 전용 팝업)
 * Unity equivalent: UIRumorSecretPopup.cs / IntelDecryptionModal.cs
 * Displays classified intelligence details, stock catalyst forewarnings,
 * and handles progressive value decay upon inspection.
 */

import { ITEM_RARITIES } from '../../data/inventoryData.js';

export class RumorPopup {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks || {};
        this.currentItem = null;
        this.onValueDroppedCallback = null;

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="rumorSecretModal" class="rumor-modal-overlay hidden">
                <div class="rumor-card">
                    <!-- Header -->
                    <div class="rumor-header">
                        <div class="rumor-header-left">
                            <span class="rumor-confidential-badge">CONFIDENTIAL</span>
                            <span class="rumor-header-title">극비 정보 / 찌라시 열람 보고서</span>
                        </div>
                        <button class="rumor-close-btn" id="btnRumorClose" title="닫기">✕</button>
                    </div>

                    <!-- Body -->
                    <div class="rumor-body">
                        <!-- Item Title & Tags -->
                        <div class="rumor-title-row">
                            <div class="rumor-icon-box" id="rumorIconBox">📜</div>
                            <div class="rumor-name-group">
                                <div class="rumor-name-text" id="rumorNameText">비트 물류 현장 찌라시</div>
                                <div class="rumor-tags">
                                    <span class="rumor-tag" id="rumorRarityTag" style="background: #00e5ff; color: #000;">희귀</span>
                                    <span class="rumor-tag" style="background: rgba(255, 171, 0, 0.2); color: #ffd54f;">🔒 미공개 내부 정보</span>
                                </div>
                            </div>
                        </div>

                        <!-- Target Enterprise Highlight Card -->
                        <div class="rumor-stock-highlight" id="rumorStockCard">
                            <div class="rumor-stock-meta">
                                <span class="rumor-stock-icon" id="rumorStockIcon">🏢</span>
                                <div>
                                    <span class="rumor-stock-name" id="rumorStockName">클라우드 베리</span>
                                    <span class="rumor-stock-sector" id="rumorStockSector">IT/기술</span>
                                </div>
                            </div>
                            <div class="rumor-change-badge positive" id="rumorChangeBadge">+20.0% 급등 예상</div>
                        </div>

                        <!-- Secret Document Content Box -->
                        <div class="rumor-doc-box">
                            <div class="rumor-doc-header">
                                <span>🕵️ 현장 첩보 해독 요약</span>
                            </div>
                            <div class="rumor-doc-text" id="rumorDocText">
                                내용 로딩 중...
                            </div>
                        </div>

                        <!-- Market Impact Effects -->
                        <div class="rumor-effects-box" id="rumorEffectsBox">
                            <div class="rumor-effects-title">📊 주가 영향 및 복선 분석</div>
                            <div id="rumorEffectsList"></div>
                        </div>

                        <!-- Value Depletion & Market Exposure Status -->
                        <div class="rumor-value-status-box">
                            <div class="rumor-price-change-row">
                                <span>상점 매각 가치 변동</span>
                                <div>
                                    <span class="rumor-old-price" id="rumorOldPrice">2,000 G</span>
                                    <span class="rumor-new-price" id="rumorNewPrice">➔ 1,000 G</span>
                                    <span class="rumor-read-badge" id="rumorReadBadge">1회 열람됨</span>
                                </div>
                            </div>
                            <div class="rumor-depletion-note">
                                ⚠️ 찌라시 정보는 열람할 때마다 시장 유출 위험 및 신선도 저하로 인해 <b>상점 매각 가치가 50%씩 감소</b>합니다.
                            </div>
                        </div>
                    </div>

                    <!-- Footer Action -->
                    <div class="rumor-footer">
                        <button class="rumor-confirm-btn" id="btnRumorConfirm">열람 확인 완료</button>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modal = document.getElementById('rumorSecretModal');
        this.btnClose = document.getElementById('btnRumorClose');
        this.btnConfirm = document.getElementById('btnRumorConfirm');
        this.iconBox = document.getElementById('rumorIconBox');
        this.nameText = document.getElementById('rumorNameText');
        this.rarityTag = document.getElementById('rumorRarityTag');
        this.stockCard = document.getElementById('rumorStockCard');
        this.stockIcon = document.getElementById('rumorStockIcon');
        this.stockName = document.getElementById('rumorStockName');
        this.stockSector = document.getElementById('rumorStockSector');
        this.changeBadge = document.getElementById('rumorChangeBadge');
        this.docText = document.getElementById('rumorDocText');
        this.effectsList = document.getElementById('rumorEffectsList');
        this.oldPrice = document.getElementById('rumorOldPrice');
        this.newPrice = document.getElementById('rumorNewPrice');
        this.readBadge = document.getElementById('rumorReadBadge');
        this.depletionNote = document.querySelector('.rumor-depletion-note');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        this.btnConfirm?.addEventListener('click', () => this.close());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    open(item, onValueDropped) {
        if (!item) return;
        this.currentItem = item;
        this.onValueDroppedCallback = onValueDropped;

        const isFirstRead = !item.isRead;
        const previousPrice = item.price || 1000;
        let newPriceVal = previousPrice;

        if (isFirstRead) {
            item.isRead = true;
            item.readCount = 1;
            newPriceVal = Math.max(100, Math.floor(previousPrice * 0.5));
            item.price = newPriceVal;
        } else {
            item.readCount = (item.readCount || 1) + 1;
        }

        const rarity = ITEM_RARITIES[item.rarity] || ITEM_RARITIES.rare;

        if (this.iconBox) this.iconBox.textContent = item.icon || '📜';
        if (this.nameText) this.nameText.textContent = item.name;
        if (this.rarityTag) {
            this.rarityTag.textContent = rarity.name;
            this.rarityTag.style.background = rarity.color;
            this.rarityTag.style.color = '#000';
        }

        // Target Stock and Enterprise Change Info
        const stockNameVal = item.targetStockName || '클라우드 베리';
        const sectorVal = item.targetSector || 'IT/기술';
        const changeVal = item.targetChange || '+18.5% ~ +25.0% 급등 예상';
        const isNegative = changeVal.includes('-') || changeVal.includes('하락') || changeVal.includes('악재');

        if (this.stockName) this.stockName.textContent = stockNameVal;
        if (this.stockSector) this.stockSector.textContent = `[${sectorVal}]`;
        if (this.stockIcon) {
            const sectorIcons = { 'IT/기술': '💻', '바이오/제약': '🧬', '금융/핀테크': '🏦', '우주/항공': '🚀', '엔터/미디어': '🎬' };
            this.stockIcon.textContent = sectorIcons[sectorVal] || '🏢';
        }

        if (this.changeBadge) {
            this.changeBadge.textContent = changeVal;
            this.changeBadge.className = `rumor-change-badge ${isNegative ? 'negative' : 'positive'}`;
        }

        if (this.docText) {
            this.docText.textContent = item.intelReport || item.desc || '미공개 내부 정보가 포함되어 있습니다.';
        }

        if (this.effectsList) {
            if (item.effects && item.effects.length > 0) {
                this.effectsList.innerHTML = item.effects
                    .map(eff => `<div class="rumor-effect-item"><span>•</span> <span>${eff}</span></div>`)
                    .join('');
            } else {
                this.effectsList.innerHTML = `<div class="rumor-effect-item">• 대상 기업: ${stockNameVal} (${changeVal})</div>`;
            }
        }

        if (isFirstRead) {
            if (this.oldPrice) {
                this.oldPrice.style.display = 'inline';
                this.oldPrice.textContent = `${previousPrice.toLocaleString()} G`;
            }
            if (this.newPrice) this.newPrice.textContent = `➔ ${newPriceVal.toLocaleString()} G (-50%)`;
            if (this.readBadge) this.readBadge.textContent = '최초 열람 (개봉 완료)';
            if (this.depletionNote) {
                this.depletionNote.innerHTML = '⚠️ 찌라시를 개봉하여 확인했으므로 정보 신선도 저하로 인해 <b>상점 매각 가치가 50% 하락</b>했습니다. (이후 재열람 시 추가 하락 없음)';
            }
        } else {
            if (this.oldPrice) this.oldPrice.style.display = 'none';
            if (this.newPrice) this.newPrice.textContent = `${item.price.toLocaleString()} G (가치 유지)`;
            if (this.readBadge) this.readBadge.textContent = '열람 완료된 정보';
            if (this.depletionNote) {
                this.depletionNote.innerHTML = 'ℹ️ 이미 개봉된 찌라시 정보입니다. 내용 재열람 시 매각 가치는 변동되지 않습니다.';
            }
        }

        this.modal?.classList.remove('hidden');

        if (this.onValueDroppedCallback) {
            this.onValueDroppedCallback(item, { isFirstRead, previousPrice, newPrice: newPriceVal, readCount: item.readCount });
        }
    }

    close() {
        this.modal?.classList.add('hidden');
    }
}
