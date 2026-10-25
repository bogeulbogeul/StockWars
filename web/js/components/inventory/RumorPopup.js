import { RumorQuizCard } from './RumorQuizCard.js';
import { getItemArtwork } from '../../data/itemArtwork.js';
/**
 * RumorPopup Component (정보 / 찌라시 극비 열람 전용 팝업)
 * Unity equivalent: UIRumorSecretPopup.cs / IntelDecryptionModal.cs
 * Displays classified intelligence details, stock catalyst forewarnings,
 * and handles progressive value decay upon inspection.
 */

import { rumorDecryption } from '../../engine/RumorDecryption.js';
export { rumorDecryption } from '../../engine/RumorDecryption.js';

export class RumorPopup {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks || {};
        this.currentItem = null;
        this.onValueDroppedCallback = null;

        this.render();
        this.initDOM();
        this.quizCard = new RumorQuizCard(this);
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="rumorSecretModal" class="rumor-modal-overlay hidden">
                <div class="rumor-card" role="dialog" aria-modal="true" aria-label="소식 편지 읽기">
                    <!-- Header -->
                    <div class="rumor-header">
                        <div class="rumor-header-left">
                            <img class="rumor-envelope-art" src="${getItemArtwork('item_premium_rumor')}" alt="" />
                            <div>
                            <span class="rumor-header-title">소식 편지 읽기</span></div>
                        </div>
                        <button class="rumor-close-btn" id="btnRumorClose" title="닫기">✕</button>
                    </div>

                    <!-- Body -->
                    <div class="rumor-body">
                        <!-- Item Title & Tags -->
                        <div class="rumor-title-row">
                            <div class="rumor-name-group">
                                <div class="rumor-name-text" id="rumorNameText">현장 찌라시</div>
                            </div>
                        </div>

                        <!-- Secret Document Content Box -->
                        <div class="rumor-doc-box">
                            <div class="rumor-doc-text" id="rumorDocText">
                                내용 로딩 중...
                            </div>
                        </div>
                    </div>

                    <!-- Footer Action -->
                    <div class="rumor-footer">
                        <button class="rumor-confirm-btn" id="btnRumorConfirm">편지 접어 두기</button>
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
        this.nameText = document.getElementById('rumorNameText');
        this.docText = document.getElementById('rumorDocText');
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

        const decoded = this.refreshInterpretation();
        this.quizCard.reset(item, decoded);

        this.modal?.classList.remove('hidden');
        this.callbacks.onRumorOpened?.(item, decoded);

        if (this.onValueDroppedCallback) {
            this.onValueDroppedCallback(item, { isFirstRead, previousPrice, newPrice: newPriceVal, readCount: item.readCount });
        }
    }

    refreshInterpretation() {
        const item = this.currentItem;
        if (!item) return;
        const decoded = rumorDecryption(item.intelReport || item.desc || '미공개 현장 소식이에요.',
            item, this.callbacks.getAnalysisLevel?.() ?? 1);
        const companyStage = decoded.legacy ? 4 : 2;
        if (this.nameText) this.nameText.textContent = decoded.level < companyStage && item.targetStockName
            ? item.name.replaceAll(item.targetStockName, '익명 기업') : item.name;
        if (this.docText) this.docText.textContent = decoded.text;
        return decoded;
    }

    close() {
        const wasOpen = this.modal && !this.modal.classList.contains('hidden');
        this.modal?.classList.add('hidden');
        if (wasOpen) this.callbacks.onRumorClosed?.();
    }
}
