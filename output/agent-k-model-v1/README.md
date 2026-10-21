> **2026-10-20 폐기:** 에이전트 K의 이전 외형이다. 제작 이력으로만 보존하며 신규 제작 참고·게임 재적용에 사용하지 않는다. 현행은 `output/agent-k-glasses-v6/`다.

# 에이전트 K 모델 v1 — 2026-10-20

## 증권사 데스크 배치 후속

**P0 (Core) · ✅ 웹·실행본 리소스 반영 및 브라우저 검사 / ⏳ 사용자 시각 검수.** `web/assets/characters/3d/agent-k/Agent-K.glb`를 로비 안내 데스크 뒤 중앙 `(0, -275)`에 배치했다. 기본 몸체 높이는 110이며 결정 포함 높이는 약 141이다. 기본 자세로 방문객을 바라보고 걷기는 재생하지 않는다. `CipherAgentK.js`가 모델 로딩·접지·그림자를, `cipherLobbyRoom.js`가 위치·크기·충돌 범위를 담당한다. 로비 기본 시점에서 얼굴·조끼가 보이도록 뒤쪽 여백을 확보했다.

`scratch/check-cipher-agent-k.cjs`로 웹/실행본 리소스 각각 단일 NPC, 데스크와 비접촉, 바닥 접지, 결정·조끼 메시, 몸 통과 방지, Esc 마을 복귀 및 JavaScript 오류 없음을 확인했다. 화면: `scratch/cipher-agent-k-desk.png`, `scratch/cipher-agent-k-close.png`. 기존 전체 로비 검사도 출입·이동·화면 크기·저장 검사를 진행했으나 마지막 콘솔 검사에서 미확인 리소스 404 하나로 실패했다. 대화·투자 업무 연결, Electron 프로세스 직접 실행·설치 프로그램 재생성은 이번 배치 범위에 포함하지 않는다.

사용자 요청으로 소망이 기본 몸체를 사용하고 안나 조끼를 재활용한 에이전트 K 3D 모델이다.

- 몸체·본·걷기 원본: `../somangi-walk-v4/somangi-walk.blend`.
- 조끼: `../anna-meshy-short-vest-v7/Anna-meshy-short-vest.blend`의 실제 `Anna_Vest` 메시. 형태·웨이트를 유지하고 남색 재질로 교체했다.
- 외형 참고: `../village-fairy-npcs-v1/04-agent-k.png`. 청회색 몸, 둥근 짙은 안경, 푸른 결정과 받침을 적용했다. 얼굴·몸 비율은 사용자 요청의 소망이 기본형을 유지한다.
- 안경·결정은 기존 Head 본, 조끼는 기존 Body 본을 사용한다.

[GLB](Agent-K.glb) · [Blender 원본](Agent-K.blend) · [정면](front.png) · [사선](three-quarter.png) · [측면](side.png) · [후면](back.png)

**P1 (Major) · ✅ 모델 제작·4방향 렌더 확인·GLB 재수입 검사 / ⏳ 사용자 시각 검수·전체 동작 접촉 검사·게임 적용.**

`validation.json`에서 소망이 몸체 4개 메시와 안나 조끼의 정점 좌표 보존, 7본 및 GLB 재수입을 확인했다. 걷기 클립을 보존하지만 전체 프레임의 조끼·안경 접촉 검사를 완료한 상태는 아니다. 기존 게임·실행본·원본 파일은 변경하지 않았다.

재현: Blender에서 `build.py` 실행.
