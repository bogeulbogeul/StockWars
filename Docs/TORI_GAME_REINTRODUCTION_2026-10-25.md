# 토리 게임 재적용 — 2026-10-25

P1 (Major) · ✅ 웹/기존 실행본 리소스 반영·브라우저 검증 / ⏳ 사용자 최종 외형·플레이 검수.

사용자 요청 “토리도 게임에 적용해줘”에 따라 [보석 접합부 v3](../output/tori-crystal-clean-v3/README.md)를 증권사 3D 로비의 안내 데스크 뒤에 연결했다. 소망이 체형·청회색 몸·둥근 안경·파란 결정·기본 미소를 유지한다. 조끼·보석 받침·구형 증권사 UI는 복원하지 않는다.

- `web/assets/characters/3d/tori/tori.glb`: 제작본 그대로 설치. SHA256 `83b1db88d0ce859affe84dfd2c895f8f5b72be569ffe953facbc3cbf59aafb4a`.
- `CipherAgentK.js`: 공통 캐시에서 본/재질을 독립 복제해 정지 자세로 표시한다. 몸체 높이 100, 결정 포함 높이 약 128.714 월드 단위다. 원본 걷기는 포함하되 자율 보행·새 표정 전환은 연결하지 않았다.
- `cipherLobbyRoom.js`: 기존 안내자 중심 (0, -205)에 충돌 반경 31과 플레이어 반경 22를 합산했다. 기존 데스크·문·로비 이동 계약을 유지한다.
- `electron-app/dist/win-unpacked/resources/web/`에 같은 모델 및 두 모듈을 동기화했다. 제작본/웹/실행본 GLB 해시 동일.

`scratch/check-tori-game.cjs`로 실제 게임 시작 → 증권사 입장 흐름을 실행했다. 웹과 실행본 리소스 각각 한 명 표시·결정/안경 존재·의상/받침 없음·발 바닥 접지·충돌·입구/측면 통행·양쪽 방 출입 판정·1280×800 및 390×844 표시를 검사했다. 브라우저 예외·에셋 로딩 오류 0건이다. 작은 화면은 기존 로비 전체 맞춤 구도를 유지한다.

[웹 화면](../output/tori-game-v1/lobby.png) · [작은 화면](../output/tori-game-v1/lobby-small.png) · [실행본 리소스 화면](../output/tori-game-v1/lobby-runtime.png) · [웹 검사 결과](../output/tori-game-v1/check.json) · [실행본 검사 결과](../output/tori-game-v1/check-runtime.json).

이는 기존 실행본 리소스의 브라우저 검증이며 Electron 직접 실행·설치 프로그램 재빌드·사용자 최종 플레이 검수는 별도다. 저장·경제·폐기 기능·다른 캐릭터는 변경하지 않았다.
