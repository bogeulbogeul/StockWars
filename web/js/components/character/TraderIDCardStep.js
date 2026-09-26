/**
 * TraderIDCardStep Module (Step 3: 출입증 발급식 & 홀로그램 ID 패스)
 * Renders the holographic Trader Pass ceremony and status bonuses.
 */

import { createGeometricAvatarSVG } from '../GeometricAvatar.js';

export class TraderIDCardStep {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
    }

    renderCeremony(profile, chosenTrait) {
        if (!chosenTrait) return;

        if (this.dom.idCardPhoto) {
            this.dom.idCardPhoto.innerHTML = `
                <div class="id-photo-geometric-wrapper" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 4px;">
                    ${createGeometricAvatarSVG({
                        shape: profile.shape || 'square',
                        skinTone: profile.skinTone || 'fair',
                        hairStyle: profile.hairStyle || 'short',
                        direction: 'front'
                    })}
                </div>
            `;
        }

        if (this.dom.idCardName) {
            this.dom.idCardName.textContent = profile.nickname || '사이퍼 트레이더';
        }

        if (this.dom.idCardTrait) {
            this.dom.idCardTrait.textContent = `${chosenTrait.icon} ${chosenTrait.title}`;
            this.dom.idCardTrait.style.color = chosenTrait.statColor;
            this.dom.idCardTrait.style.borderColor = chosenTrait.statColor;
        }

        if (this.dom.idCardBonusVal) {
            this.dom.idCardBonusVal.textContent = `${chosenTrait.statName} • ${chosenTrait.bonusDesc}`;
        }

        // Personal unique trader code (e.g. CIPHER-TRD-8X2F-9B41)
        if (!profile.traderCode) {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let seg1 = '', seg2 = '';
            for (let i = 0; i < 4; i++) seg1 += chars.charAt(Math.floor(Math.random() * chars.length));
            for (let i = 0; i < 4; i++) seg2 += chars.charAt(Math.floor(Math.random() * chars.length));
            profile.traderCode = `CIPHER-TRD-${seg1}-${seg2}`;
        }

        if (this.dom.idCardRegNum) {
            this.dom.idCardRegNum.textContent = profile.traderCode;
        }

        if (this.dom.ceremonyAnnaSpeech) {
            this.dom.ceremonyAnnaSpeech.textContent = `"축하합니다, ${profile.nickname}님! 사이퍼 증권 트레이더 출입증 발급이 완료되었습니다. [${chosenTrait.title}] 성향으로 게임 내 ${chosenTrait.effect} 효과가 즉시 적용됩니다."`;
        }
    }
}