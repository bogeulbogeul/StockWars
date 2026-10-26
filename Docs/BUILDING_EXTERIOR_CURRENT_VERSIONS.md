# 건물 외관 최신 제작본과 이전본 폐기 — 2026-10-25

사용자 요청 “이전 에셋들은 폐기해줘”에 따라 아래 9종을 현행 **제작본**으로 지정한다. 이 표로 대체된 이전 외관 버전·미채택 수정본은 사용 폐기이며 새 제작/배포/폴백의 입력으로 자동 복원하지 않는다. 원본·과거 기록은 보존한다.

| 건물 | 최신 제작본 폴더 | 전달 모델 |
|---|---|---|
| 집·오른쪽 우체통 | `output/home-envelope-correct-v7/` | `Home-with-right-mailbox.glb`, `Home-redesign.glb`, `Mailbox-right.glb` |
| 정착 안내소 | `output/information-corner-foot-remove-v8/` | `Information-clean.glb` |
| 비비안 잡화점 | `output/vivian-panel-molding-v11/` | `VivianStore-clean.glb` |
| 모던 프레임 가구점 | `output/furniture-redesign-v2/` | `Furniture-clean.glb` |
| 사이퍼 증권 | `output/cipher-roof-clean-v24/` | `CipherSecurities-clock.glb` |
| 노드 은행 | `output/bank-timber-roof-fit-v7/` | `Bank-clean.glb` |
| 데이터 잉크 서점 | `output/bookstore-roof-clean-v3/` | `Bookstore-clean.glb` |
| 미드나잇 펍 | `output/pub-timber-fit-v5/` | `Pub-clean.glb` |
| 우체국 | `output/post-office-sign-match-v4/` | `PostOffice.glb` |

## 폐기 범위

- 표의 최신본으로 대체된 이전 외관 형상·구형 지붕·문양과 중간 수정본은 현행에서 제외한다. 우체국 벽체 채움 오해본과 은행의 미채택 모서리 실험도 복원하지 않는다.
- 디자인 시안, 제작 스크립트/공통 형상 유틸리티, 이전 blend/GLB/렌더는 제작 이력과 재현 의존성으로 보존한다. 최신 빌드가 이전 원본을 읽는 경우가 있으므로 폴더를 일괄 삭제하지 않는다.
- 실내·가구·캐릭터·기능·저장은 이번 외관 폐기 범위가 아니다. 이미 폐기된 옷가게는 복원하지 않는다.

## 게임 적용과 구분

증권사 v24 적용 후속: 사용자 요청으로 최신 지붕 수정본을 웹·기존 실행본에 반영했다. 배치·배율은 유지하며 [v24 적용·시계/동선 검증](../output/cipher-roof-game-v24/README.md)을 따른다. 이전 v23 최초 적용 기록보다 이번 모델을 우선한다.

최신 배치 후속: 사용자 요청으로 마을 요소를 다시 배치했다. 외관 목록은 유지하며 현행 좌표·길·소품은 [마을 재배치 v1](../output/town-layout-refresh-v1/README.md)을 따른다. 아래 우체국 최초 배치 좌표는 이전 이력이다.

후속 사용자 요청 “게임 건물 에셋들 외관을 좀 변경했는데 게임에 적용해줘”와 우체국 외관 배치 승인에 따라 표의 9종을 `web/`와 기존 로컬 실행본에 적용했다. 우체국은 집과 가구점 사이 `(850, 1350)`에 배치하고 충돌과 진입로만 연결했다. 우편 기능·실내는 추가하지 않았다. 변경 모델의 문 실측에 맞춰 배율과 필요한 출입 기준점을 조정했다.

양쪽 브라우저에서 9종 로딩·표시 폭·충돌·입구 앞 통로·건물 충돌 영역 겹침 없음·증권사 KST 시계·작은 화면·JavaScript 오류 없음을 확인했다. 원본/웹/실행본 GLB SHA-256도 일치한다. [적용·검증 기록](../output/exterior-current-rollout-2026-10-25/README.md)을 따른다.

P1 · ✅ 최신 제작본 지정·이전본 사용 폐기·웹/기존 실행본 적용·자동 검증 / ⏳ 사용자 최종 시각/플레이 검수. 설치 프로그램은 재빌드하지 않았다.
