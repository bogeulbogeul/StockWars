# 강아지 RGB 모션 시트 v1

2026-10-18 후속: 사용자 적용 요청으로 이 시트를 `web/assets/characters/dog-rgb-motion-v1/atlas.png`에 설치하고 기존 `dog` 스타일에 연결했다. 아래 미설치 설명은 제작 당시 상태다. 설치 파일·렌더러 회귀20검사 통과. 앱 브라우저의 로컬 서버 연결 실패로 실제 플레이 접촉 시각 검수는 미완료다.

상세 추출 RGB 40항목(중복 제외 34색)을 기준으로 기존 채택 강아지 모션을 재색상화했다. 신규 자세 생성이나 게임 설치는 하지 않았다.

- 외형·RGB 참고: `../dog-design-2026-10-18-v1/design-sheet.png`, `colors-detailed.json`
- 동작·투명도 원본: `../sigeureujabeujong-unified-v1/run/`
- 최종 전달: 이 폴더의 `sprite-sheet-alpha.png`, `manifest.json`
- 크기: 2048×5120, 셀 512×512, 10행19그림(16고유 그림)
- 걷기: 정면·오른쪽 정측면·뒤 각각 A→중립→B→중립, 160ms. 정지는 걷기 중립 공유.
- 운반: 오른쪽 정측면 4그림, 160ms. 화물은 별도 오브젝트.
- 앉기: 정면·아이소메트릭 오른쪽 앞사선 유지 자세. 얼굴 초상화 별도.
- 확인: `preview.html`, `run/previews/*.gif`, `validation.json`

색은 sprite-gen recolor의 최근접 RGB 변환(tolerance 255, alpha threshold 0)으로 처리했다. 모든 alpha>0 픽셀은 추출 34색 안에 있고 알파는 원본과 동일하다. 부위별 마스크가 아닌 전체 공통 팔레트 변환이므로 특정 부위의 모든 픽셀이 단일 RGB로 고정됐다는 뜻은 아니다. 제한 팔레트에 따라 원본의 연속 명암은 단계화된다. `baked/recolor.report.json`에 변환량을 기록했다.

기존 완성 시트를 사용하므로 새 이미지 생성·추출은 수행하지 않았다. sprite-gen의 recolor → unpack-atlas → compose-atlas → compose-gif → inspect를 사용했다. unpack/compose가 6fps를167ms로 반올림해 최종 manifest는 원본 좌표·160ms를 보존하는 방식으로 패키징했고 파생 미리보기 metadata도160ms로 맞췄다. GIF는16ticks로 출력했다. 패키징·검증은 `package_result.py`로 재현한다.

정적 외형 및 자세 배열을 확인했다. 모션은 기존 채택 자세를 유지하며 새 모션 자연스러움 통과 판정이나 실제 게임 이동·접촉 검수 완료를 의미하지 않는다. 제작 기준 자동 채택·게임 복원은 하지 않는다.
