from pathlib import Path
p=Path('output/shop-items-game-v1/README.md');s=p.read_text(encoding='utf-8-sig').replace('19개 적용 파일','20개 적용 파일');s+='''

✅ 웹·기존 실행본 리소스 각각 검증 완료: 12종 선택, 수량/1,600잎 구매·영수증, 모바일 가로 넘침 없음, 실제 표준 모드 잡화점 입장·구매창 닫기/실내 복귀, 10종/32개 진열 확인. 상품 AABB 겹침 0건, 선반 지지/범위 오류 0건, 장식 충돌체 0개, 기존 가구 충돌체 110개와 중앙/출구 통로 유지. 브라우저 실행 오류·누락 리소스 0건. 지지·겹침 검사는 AABB 기준이며 모든 삼각형의 전수 교차 검사와는 구분한다.

같은 재질의 정적 불투명 부품을 원본 정점·UV·변환 그대로 묶어 실내 렌더링 호출을 2,376→878회로 약63% 줄였다. 투명 병·라벨은 별도 유지한다. 기록된 4,389,192 삼각형은 투과 패스 포함 렌더러 집계이며 단일 메시 원본 면 수와 다르다. 기기별 FPS 측정이나 사용자 플레이 검수를 뜻하지 않는다.

실제 렌더: `web-game-room.png`, `desktop-game-room.png`, `cabinet.png`, `fridge.png`, `web-shop.png`, `web-juice.png`, `web-mobile.png`.
''';p.write_text(s,encoding='utf-8')
p=Path('output/shop-items-refined-current-v2/README.md');s=p.read_text(encoding='utf-8-sig');i=s.index('\n');s=s[:i]+'''\n\n후속 사용자 요청으로 [게임 적용·진열 v1](../shop-items-game-v1/README.md)에 웹·기존 실행본 적용을 완료했다. 이 문서와 manifest의 `assets_only_not_deployed`/`deployed:false`는 제작 시점의 원본 감사 기록이며, 현재 배포 상태는 후속 적용 기록을 따른다.\n'''+s[i:];p.write_text(s,encoding='utf-8')
