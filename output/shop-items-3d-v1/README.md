# 상점 상품 12종 네이티브 3D 에셋

사용자 피드백을 반영한 최신 개별 모델은 [수정본 12종 목록](../shop-items-refined-current-v2/README.md)을 따른다. 이 폴더의 최초 일괄 제작본은 이력으로 보존한다.

2026-10-25 사용자 요청: 현행 상점 아이템 이미지를 따라 3D 에셋 제작.

후속 꿀쿠키 수정은 [원본 이미지 일치 보정 v2](../honey-cookie-reference-v2/README.md)를 따른다. 이 폴더의 기존 꿀쿠키는 수정 전 이력이며 다른 11종은 유지한다.

꽃잎 차 후속 수정은 [종이상자 보정 v2](../petal-tea-paperbox-v2/README.md)를 따른다. 해당 개별 수정본이 이 폴더의 기존 꽃잎 차보다 우선하며 다른 상품은 유지한다.

사과주스 후속 수정은 [원본 이미지 보정 v2](../apple-juice-reference-v2/README.md)를 따른다. 해당 개별 모델이 이 폴더의 기존 사과주스보다 우선한다.

포포리빵 후속 수정은 [원본 통빵 보정 v2](../popori-bread-reference-v2/README.md)를 따른다. 해당 개별 모델이 이 폴더의 기존 포포리빵보다 우선한다.

꽃꿀 베리 주스 후속 수정은 [원본 이미지 보정 v2](../berry-juice-reference-v2/README.md)를 따른다. 해당 개별 모델이 이 폴더의 기존 베리 주스보다 우선한다.

허브 차 후속 수정은 [종이상자 보정 v2](../herb-tea-paperbox-v2/README.md)를 따른다. 해당 개별 모델이 이 폴더의 기존 허브 차보다 우선한다.

이슬젤리 후속 수정은 [원본 이미지 보정 v2](../dew-jelly-reference-v2/README.md)를 따른다. 해당 개별 모델이 이 폴더의 기존 이슬젤리보다 우선한다.

꽃꿀사탕 후속 수정은 [원본 이미지 보정 v2](../honey-candy-reference-v2/README.md)를 따른다. 해당 개별 모델이 이 폴더의 기존 꽃꿀사탕보다 우선한다.

별가루·달가루 후속 수정은 [종이봉지와 가루 보정 v2](../star-moon-powders-v2/README.md)를 따른다. 해당 개별 모델들이 이 폴더의 기존 별가루·달가루보다 우선한다.

복권 후속 수정은 [얇은 종이 티켓 보정 v2](../lotto-paper-ticket-v2/README.md)를 따른다. 해당 개별 모델이 이 폴더의 기존 복권보다 우선한다.

봉인된 소식 봉투 후속 수정은 [닫힌 종이봉투 보정 v2](../sealed-news-envelope-v2/README.md)를 따른다. 해당 개별 모델이 이 폴더의 기존 소식 봉투보다 우선한다.

## 결과

- [실제 모델 정면 사선 렌더](preview.png), [내보낸 GLB를 다시 불러온 후면 렌더](rear.png)
- [편집용 Blender 원본](Shop-items.blend), [상품별 파일·SHA-256](manifest.json), [GLB 재수입 검증](validation.json)
- [재현 제작 스크립트](build.py), [검증 스크립트](verify.py)

| 상품 | 개별 모델 |
| --- | --- |
| 꿀 쿠키 4개입 | [item_honey_cookie.glb](item_honey_cookie.glb) |
| 꽃잎 차 | [item_petal_tea.glb](item_petal_tea.glb) |
| 사과 주스 | [item_apple_juice.glb](item_apple_juice.glb) |
| 포포리빵 | [item_popori_bread.glb](item_popori_bread.glb) |
| 꽃꿀 베리 주스 | [item_berry_juice.glb](item_berry_juice.glb) |
| 허브 차 | [item_herb_tea.glb](item_herb_tea.glb) |
| 이슬 젤리 | [item_dew_jelly.glb](item_dew_jelly.glb) |
| 꽃꿀 사탕 | [item_honey_candy.glb](item_honey_candy.glb) |
| 별가루 | [item_crypto_decoder.glb](item_crypto_decoder.glb) |
| 달가루 | [item_moon_powder.glb](item_moon_powder.glb) |
| 로또 | [item_lotto_ticket.glb](item_lotto_ticket.glb) |
| 봉인된 소식 봉투 | [item_premium_rumor.glb](item_premium_rumor.glb) |

## 참조와 제작

현행 `web/js/data/vivianStoreData.js`의 12종과 `itemArtwork.js` → `packingProductArt.js`의 실제 표시 이미지를 기준으로 했다. 공통 `web/assets/items/packing-v1/items.png`, 최신 통빵 `popori-bread-v2.png`, `paper-v4/lotto.svg`·`sealed-news.svg`를 직접 열어 확인했다. 과거 판매 중단 상품은 포함하지 않았다.

병·뚜껑·종이 상자·트레이·봉지·가루 입자·쿠키·젤리·사탕·꽃/잎 표식은 편집 가능한 실제 형상이다. 무광 재질과 부드러운 모서리로 게임의 클레이 표현에 맞췄다. 원본 일러스트의 붓 질감과 반짝임은 그대로 복제하지 않고 입체 형태로 단순화했다. 포포리빵은 단면 없는 길쭉한 통빵이다. 별가루는 금색 별, 달가루는 보라색 바탕과 크림색 초승달로 구별한다.

로또·봉투는 두께 있는 종이 몸체에 승인된 v4 인쇄 그림을 사용하며 GLB 안에 PNG를 내장했다. 봉투 뒷면 접힘과 앞면 초록 봉인은 별도 형상이다. 로또 인쇄 숫자는 원본 그림의 예시이며 게임에서 발급한 실제 번호 표시 기능을 구현한 것은 아니다. 인쇄면의 투명 여백은 알파로 처리한다.

개별 GLB는 스튜디오 조명·카메라·바닥을 제외하고 상품만 포함한다. Blender Z-up에서 제작하고 GLB는 표준 Y-up으로 내보냈다. 정면은 Blender -Y / GLB +Z 방향이다. 바닥 중심 기준의 상대 크기이며 게임 월드 배율이나 충돌체는 아직 지정하지 않았다. 원본 .blend는 4열×3행 검토 배치를 포함한다.

## 검증과 적용 범위

12개 GLB의 헤더/길이, 실제 Blender 재수입, 유한 정점 좌표, 세 축의 양수 크기, 포함된 이미지 디코딩을 확인한다. 상세 수치와 실제 재수입 삼각형 수는 `validation.json`에 기록한다. 정면 사선과 재수입 후면 렌더를 시각 확인한다. 사용자 최종 외형 검수는 별도다.

이번 결과는 에셋 제작이다. 상점 UI의 3D 표시 전환, 웹/기존 실행본 배포, 설치 프로그램 재빌드는 수행하지 않았다. 기존 2D 상점·가방·포장 퍼즐·가격·보유 데이터·저장은 변경하지 않았다.
