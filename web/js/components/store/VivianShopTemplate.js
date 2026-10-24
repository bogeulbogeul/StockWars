// Purchase view: wooden display shelves beside a paper order slip.
import { shopFlowerMark as flower } from './ShopFlowerMark.js';
export function getFlowerShopHtml() {
    return `<section class="flower-shop hidden" id="vivianShopPanel" role="dialog" aria-modal="true" aria-labelledby="flowerShopTitle">
        <header class="flower-shop-heading">
            <div class="flower-brand"><span class="flower-emblem">${flower}</span><div><h1 id="flowerShopTitle">봉봉 잡화점</h1></div></div>
            <div class="flower-utilities"><div class="flower-wallet"><span>내 지갑</span><strong id="vivianUserCash">0잎</strong></div><button id="btnVivianClose" class="flower-close" aria-label="구매창 닫기" title="상점으로 돌아가기">✕</button></div>
        </header>
        <div class="flower-shop-main">
            <section class="flower-display" aria-label="상품 진열대">
                <div class="flower-shelf-scroll"><div class="flower-shelf-grid" id="vivianItemsGrid"></div></div>
            </section>
            <aside class="flower-order" id="vivianPurchaseDrawer" aria-label="선택한 상품과 결제">
                <div class="flower-order-paper">
                    <div class="flower-order-top"><span>봉봉의 계산서</span><span aria-hidden="true">${flower}</span></div>
                    <div class="flower-order-details"><div class="flower-product-stage" id="drawerItemIcon"></div>
                    <div class="flower-order-product"><h2 id="drawerItemName"></h2><p id="drawerItemDesc"></p></div>
                    </div><div class="flower-checkout"><div class="flower-quantity"><div class="flower-quantity-controls"><div class="flower-stepper"><button id="btnQtyMinus" aria-label="수량 줄이기">−</button><input id="vivianQtyInput" type="number" value="1" min="1" max="99" aria-label="구매 수량"><button id="btnQtyPlus" aria-label="수량 늘리기">+</button></div><button id="btnQtyMax" class="flower-max">최대</button></div></div>
                    <div class="flower-total"><span>합계</span><strong id="vivianTotalPrice">0잎</strong></div>
                    <button class="flower-buy" id="btnVivianBuy">구매하기</button>
                    </div>
                </div>
            </aside>
        </div>
    </section>`;
}
