# 최신 외관 9종 게임 적용 — 2026-10-25

P1 (Major) · ✅ 웹·기존 로컬 실행본 적용·자동 검증 / ⏳ 사용자 최종 시각·플레이 검수

사용자 요청으로 `Docs/BUILDING_EXTERIOR_CURRENT_VERSIONS.md`의 최신 제작본을 적용했다. 정확한 원본과 게임 파일 대응은 `sources.json`, 원본/웹/기존 실행본 SHA-256 대조는 `hashes.json`이다. 집은 `Home-with-right-mailbox.glb`를 기존 게임 경로 `Home-inset-window.glb`로 전달한다. 서점은 이미 같은 최신본이어서 일치 확인·동기화했다.

- 집/우체통 v7, 안내소 v8, 잡화점 v11, 가구점 v2, 증권사 v23, 은행 v7, 서점 지붕 v2, 펍 v5, 우체국 v4.
- 우체국 신규 외관 배치는 사용자 추가 승인에 따른다. 집과 가구점 사이 `(850, 1350)`, 문 높이 125 기준이며 충돌과 진입로를 연결했다. 우편 기능·우체국 실내는 구현하지 않았다.
- 변경된 모델의 문 높이·모델 중심·문 중심을 브라우저 GLTFLoader로 실측했다. `measurements.json`에 이전본/최신본 값을 보존한다. 배율은 `townObjectScale.js`, 배치·출입 기준점은 `townModelBuildings.js`, 우체국 진입로는 `townLandscapeLayout.js`다. 캐릭터 배율은 유지한다.
- 기존 시설 기능·실내·저장은 변경하지 않았다. 기존 로컬 실행본은 `electron-app/dist/win-unpacked/resources/web`에 동기화했으며 설치 프로그램은 재빌드하지 않았다.

`node scratch/check-current-exteriors.cjs`와 동일 명령에 실행본 리소스 경로를 전달해 양쪽 모두 통과했다. 결과는 `web-checks.json`, `desktop-checks.json`이다. 9종 로딩·표시 폭·중앙 충돌·문 앞 통로·건물 충돌 영역 겹침 0건·새로 실측한 문 높이 125·집/안내소/증권사/우체국 문 중심 정렬·900×700 표시·JavaScript 오류 없음을 확인했다. 증권사 시계는 뉴욕 브라우저 시간대에서도 KST 네 시점의 실제 바늘 방향과 1분 경과를 확인했다.

`web-post_office.png`, `web-cipher_securities.png`, `web-node_finance.png`, `web-midnight_pub.png`는 게임에 로드된 모델을 확인하는 검사 카메라 렌더다. 사용자 기본 카메라 플레이 검수나 모델 접합부의 전체 비관통 검증 완료를 뜻하지 않는다. 모델 제작 폴더의 당시 미적용 기록은 이 후속 적용과 구분해 이력으로 보존한다.
