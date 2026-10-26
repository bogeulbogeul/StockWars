import { bindingLabel } from '../../app/GameKeys.js';
import { dialogueThemeStyle } from '../dialogue/dialogueTheme.js';
/**
 * VivianStoreTemplate
 * Generates semantic HTML markup for Vivian's General Store modal & interior scene.
 */

import { getFlowerShopHtml } from './VivianShopTemplate.js';
import { roomFloorClipPath } from './IsometricRoomGrid.js';
import { getVivianRoomHtml, getVivianInteriorPropsHtml, getRoomGridHtml, getVivianStaffHtml } from './VivianInteriorScene.js';
import {getVivianPackageHtml,packageFloorClip} from './VivianRoomPackage.js';

export function getVivianStoreHtml({allowLayoutEditing=false} = {}) {
    return `
        <div id="vivianStoreModal" class="modal-overlay hidden vivian-store-overlay">
            <section class="vivian-interior${allowLayoutEditing?'':' vivian-package-room'}" id="vivianInterior" tabindex="-1" aria-label="봉봉 잡화점 내부">
                ${allowLayoutEditing?getVivianRoomHtml()+getVivianInteriorPropsHtml()+getVivianStaffHtml():getVivianPackageHtml()}
                <div class="vivian-welcome-dialogue crayon-dialogue" style='${dialogueThemeStyle('bongbong')}' data-dialogue-theme="bongbong" id="vivianWelcomeBubble" role="status" hidden><div class="vivian-welcome-lines"><strong class="crayon-nameplate">봉봉</strong><p>어서오세요.<br>필요한 물건이 있으면 저에게 말을 걸어주세요.</p></div></div>
                ${allowLayoutEditing?getRoomGridHtml({editable:true}):''}
                <div class="town-player-character vivian-player" id="vivianPlayer" aria-label="플레이어 캐릭터">
                    <div class="town-char-body"><div class="char-face-front"><span class="char-eye left"></span><span class="char-eye right"></span><span class="char-smile"></span><span class="char-badge-pip"></span></div></div>
                    <div class="town-char-shadow"></div>
                </div>
                <button class="vivian-walkway" id="vivianWalkway" style="clip-path:${allowLayoutEditing?roomFloorClipPath():packageFloorClip()}" aria-label="바닥을 클릭해 이동"></button>
                <button class="vivian-interior-hotspot vivian-door-hotspot" id="btnVivianDoor" aria-label="카펫 출입구로 나가기"></button>
                <button class="vivian-exit-action" id="btnVivianExitAction" type="button" hidden>나가기 <kbd data-game-key="f">${bindingLabel('f')}</kbd></button>
                <button class="vivian-exit-action vivian-shop-action" id="btnVivianShopAction" data-store-browse="daily" type="button" hidden>상품 구매하기 <kbd data-game-key="f">${bindingLabel('f')}</kbd></button>
                <button class="vivian-interior-hotspot vivian-counter-hotspot" data-store-browse="daily" aria-label="계산대 이용하기"></button>
            </section>
            ${getFlowerShopHtml()}
            <div class="vivian-receipt-overlay" id="vivianReceipt" hidden>
                <section class="vivian-receipt" role="dialog" aria-modal="true" aria-labelledby="vivianReceiptTitle">
                    <p class="vivian-receipt-brand">봉봉 잡화점</p>
                    <h2 id="vivianReceiptTitle">구매 완료</h2>
                    <p class="vivian-receipt-date" id="vivianReceiptDate"></p>
                    <dl>
                        <div><dt>상품</dt><dd id="vivianReceiptItem"></dd></div>
                        <div><dt>수량</dt><dd id="vivianReceiptQuantity"></dd></div>
                        <div><dt>개당 가격</dt><dd id="vivianReceiptPrice"></dd></div>
                        <div class="vivian-receipt-total"><dt>결제 금액</dt><dd id="vivianReceiptTotal"></dd></div>
                    </dl>
                    <p id="vivianReceiptDelivery" role="status"></p>
                    <button type="button" id="btnVivianReceiptClose">확인 · 계속 쇼핑하기</button>
                </section>
            </div>
        </div>
    `;
}
