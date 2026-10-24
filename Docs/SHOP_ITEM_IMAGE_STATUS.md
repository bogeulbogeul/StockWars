# 잡화점 상품 이미지 현행 적용 기준

2026-10-25 v4 적용 갱신. **P1 (Major) · ✅ 실제 참조·웹/로컬 실행본 파일 대조·문서 정리 / ⏳ 사용자 최종 외형 검수.**

기준은 제작 시안이 아니라 현재 게임이 실제로 읽는 이미지다. 표시 경로는 `web/js/data/itemArtwork.js`의 `itemIconHtml()` → `packingProductArt()` 우선 → 개별 PNG 순서다. 상점 상품·선택 상품 상세·가방은 이 공통 함수를 사용한다. 현재는 2D PNG 또는 PNG 영역을 보여주는 SVG이며 판매용 네이티브 3D 상품 구현 완료로 기록하지 않는다.

## 실제 적용 파일

공통 시트는 [items.png](../web/assets/items/packing-v1/items.png)다. 영역은 원본 2000×800 기준 `x, y, 폭, 높이`이며 현재 `packingProductArt.js`와 동일하다.

| 상품 | ID | 게임 이미지·영역 | 현재 외형 |
| --- | --- | --- | --- |
| 꿀 쿠키 | `item_honey_cookie` | 공통 시트 `20,40,390,350` | 꽃 모양 쿠키 4개가 담긴 크림색 포장 |
| 꽃잎 차 | `item_petal_tea` | 공통 시트 `440,40,350,350` | 꽃 표식의 분홍색 닫힌 포장 |
| 사과 주스 | `item_apple_juice` | 공통 시트 `920,35,155,355` | 초록 뚜껑·사과 표식의 긴 병 |
| 포포리빵 | `item_popori_bread` | [popori-bread-v2.png](../web/assets/items/packing-v1/popori-bread-v2.png) | 크림색 종이로 감싼 가로 통빵 |
| 꽃꿀 베리 주스 | `item_berry_juice` | 공통 시트 `1665,25,275,370` | 초록 뚜껑·베리 표식의 붉은 병 |
| 허브 차 | `item_herb_tea` | 공통 시트 `10,490,410,235` | 잎 표식의 초록색 가로 포장 |
| 이슬 젤리 | `item_dew_jelly` | 공통 시트 `1210,430,340,330` | 흰 받침에 담긴 물방울 모양 젤리 |
| 꽃꿀 사탕 | `item_honey_candy` | 공통 시트 `1580,470,410,255` | 양쪽 포장지가 있는 금색 꽃 사탕 |
| 별가루 | `item_crypto_decoder` | 공통 시트 `450,405,300,355` | 별 표식의 금색 가루 봉투 |
| 달가루 | `item_moon_powder` | 공통 시트 `840,405,300,355` | 초승달 표식의 보라색 가루 봉투 |
| 주간 로또 | `item_lotto_ticket` | [lotto.svg](../web/assets/items/paper-v4/lotto.svg) | 연두색 가로 티켓·초록 클로버·번호 6개 |
| 봉인된 소식 봉투 | `item_premium_rumor` | [sealed-news.svg](../web/assets/items/paper-v4/sealed-news.svg) | 안쪽 종이가 보이지 않는 닫힌 크림색 봉투·초록 잎 문양 봉인 |

로또 전용 화면 `LottoPanel.js`도 위 로또 SVG를 직접 사용한다. SVG는 생성 PNG 원본을 내장하고 각 상품 영역만 표시하므로 그림 재생성·외형 변경 없이 독립 이미지로 사용한다. 별가루는 이전 암호 해독기 ID를 유지하지만 해당 ID의 구형 해독기 PNG보다 공통 시트의 별가루 영역이 우선한다. `getItemArtwork()`만 확인해 구형 PNG를 현재 외형으로 판단하지 않는다.

## 제작 이력·적용 구분

- [v2 개별 시안](../output/shop-paper-items-v2/): 산호색 티켓·꽃 봉인 봉투. 게임 참조 없음.
- [v3 정갈한 두 상품 시안](../output/shop-paper-items-v3/tidy-paper-items.png): 연두색 가로 로또·초록 봉인과 종이가 보이는 크림색 봉투. 게임 참조 없음.
- [v4 닫힌 봉투 시안](../output/shop-paper-items-v4/closed-envelope-and-lotto.png): 연두색 가로 로또·종이가 보이지 않는 닫힌 크림색 봉투. 사용자 요청으로 수정한 채택 원본이며 **2026-10-25 게임·로컬 실행본 적용**이다.

v4의 두 상품을 `paper-v4/*.svg`로 연결했다. v2·v3와 이전 주황색 티켓·보라색 봉투 PNG는 제작 이력으로 보존하며 현행 상품 참조에서 제외한다. 판매 가격·효과·보유품·실제 로또 응모 번호는 바꾸지 않는다. 티켓 그림의 번호는 장식이며 실제 발급 번호는 로또 화면의 데이터로 표시한다.

## 검증 범위

공통 이미지 경로·로또 전용 화면·v4 SVG 2개의 웹/로컬 실행본 내용 일치를 확인했다. 브라우저에서 상품 선택·구매·영수증과 새 이미지 표시를 검증했다. 로컬 경로는 `electron-app/dist/win-unpacked/resources/web/`이며 설치 프로그램 재빌드는 포함하지 않는다.

2026-10-25 포포리빵 후속: 미니게임과 상점·가방이 `packingArtworkAssets.js`의 동일 `POPORI_BREAD_URL`을 공유한다. `popori-bread-v2.png?v=whole-loaf-20261025`의 단면 없는 통빵을 사용하며, 구형 공통 시트의 잼 단면 빵으로 대체하지 않는다. 웹/로컬 실행본 이미지 바이트 일치 확인.
