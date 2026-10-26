# 캐릭터 간 충돌체 적용

P1 · ✅ 웹·기존 실행본 반영 및 자동 검증 / ⏳ 사용자 최종 플레이 검수

소망이가 마을/안내소 모아·증권사 토리·은행 차곡이를 통과하지 않도록 `CharacterBodies.js`의 공통 원형 충돌체를 연결했다. NPC 모델의 초기 실제 지면 외곽에서 반경(최소 30)을 산출하고 플레이어 반경 38과 합산해 월드 X/Z 거리로 판정한다. NPC는 위치/자세를 유지하는 kinematic body이며 밀거나 쓰러뜨리는 동적 물리·중력은 도입하지 않는다. 소망이는 기존 이동 제어를 유지한다. NPC끼리 자율 이동하는 신규 기능은 추가하지 않는다.

마을의 기존 작은 모아 직사각형 충돌체는 교체했다. 첫 도착/일반 마을은 기존 canStand와 공유 이동 분할을 사용한다. 안내소·은행·증권사는 CipherLobbyScene의 공통 이동·충돌 검사에 연결했다. NPC의 월드 위치를 판정 시마다 읽어 정류장 모아의 앉기→일어서기 이동을 따라간다. 겹침 복구는 기존 TownBodyMovement를 사용하며 실내도 같은 복구를 연결했다. 캐릭터 GLB·확정 착석 자세·스토리 조건·저장은 변경하지 않았다.

검증:

- `node --test web/tests/characterBodies.test.mjs web/tests/townPropBodies.test.mjs`: 5개 통과. 16방향 경계, 부모/캐릭터 이동 추종, 플레이어 제외, 기존 소품 충돌·겹침 복구를 확인했다.
- `node web/tests/arrivalBench.browser.cjs [리소스 루트] output/character-rigidbody-v1`: 웹·기존 실행본에서 첫 도착 키보드 이동·벤치 겹침 복구·모아 대화 거리 유지, 마을 모아 앉기/서기 두 위치, 안내소 모아·은행 차곡이·증권사 토리의 충돌체, 실내 NPC 중심에서 겹침 복구를 확인했다. JavaScript 오류 0건.
- `web-characters.json`·`desktop-characters.json`은 실제 모델의 반경/위치 기록이다. `*-arrival.json`과 `*-arrival-bench.png`는 첫 도착 회귀 검증이다.

기존 실행본 resources/web에 3개 변경 모듈을 동기화했다. 설치 프로그램은 재빌드하지 않았다. 원형 충돌은 모델 외곽의 보수적 근사이며 사용자 최종 접촉/플레이 검수는 별도다. 캐릭터가 없는 집·잡화점에 NPC를 새로 만들지 않았다.
