from pathlib import Path
p=Path('Docs/SHOP_ITEM_IMAGE_STATUS.md');s=p.read_text(encoding='utf-8-sig');heading=s.index('\n');s=s[:heading]+'''\n\n## 2026-10-25 최신: 수정본 12종 게임 적용·실내 진열

사용자 요청으로 [게임 적용 v1](../output/shop-items-game-v1/README.md)을 웹·기존 실행본에 반영했다. 구매 화면은 최신 12종 GLB를 사용하고, 복권·봉투를 제외한 10종을 장식장(차·빵·과자·가루)과 냉장고(주스·젤리)에 32개 배치했다. 아래 에셋만 제작/미적용 기록보다 이번 적용이 우선한다. 기존 구매·저장·가방/포장 2D는 유지하며 설치 프로그램 재빌드·사용자 최종 시각/플레이 검수는 별도다.
'''+s[heading:];p.write_text(s,encoding='utf-8')
p=Path('AGENTS.md');s=p.read_text(encoding='utf-8-sig');i=s.index('\n');s=s[:i]+'''\n\n## 잡화점 수정 아이템 12종 게임 적용·실내 진열 — 2026-10-25

사용자 요청으로 최신 개별 수정본 12종을 구매 화면의 3D 표시와 웹·기존 실행본 리소스에 적용했다. `web/assets/items/3d/refined-v2/` 및 `shopItemModels.js`를 사용한다. 복권·봉투를 제외한 10종은 장식장 7종/20개·냉장고 3종/12개로 진열하며 배치는 `vivianProductPlacements.js`를 따른다. 기존 가구 충돌·이동 동선·가격/효과·저장 ID·가방/포장 2D를 유지한다. 원본 GLB와 런타임 재질 보정·양쪽 브라우저 검증은 `output/shop-items-game-v1/README.md`를 따르고 설치 프로그램 재빌드·사용자 최종 검수는 별도다.
'''+s[i:];p.write_text(s,encoding='utf-8')
