# 소망이 참고 체형 정리 v6 — 2026-10-23

사용자의 정면·측면 참고에 맞춰 현재 게임 소망이의 배 폭과 깊이를 조금 줄이고 팔다리 곡면과 발 둘레를 정리했다. 흰색·얼굴·큰 머리 비율은 유지한다. 후면 참고에서 드러난 뒷머리 밑면의 튀는 면과 몸통 연결 틈을 다듬었다. 이후 “몸 밑부분이 길어 보인다”는 피드백에 따라 아랫배 밑선을 최대 0.035 모델 단위 올렸다. 이 마지막 조정은 다리와 발 좌표를 변경하지 않는다.

## 실제 적용 및 검증

- P1 (Major) · ✅ 소망이 6개 GLB의 웹·실행본 리소스 적용. NPC 의상과 다른 주민 모델은 이번 변경 대상이 아니다.
- 본·웨이트·애니메이션 키·UV·삼각형 인덱스 보존 검사 통과. 몸통과 몸체의 위치·법선만 수정했다. 뒷머리 아래 일부 정점도 후면 연결 정리를 위해 수정했다.
- 기존 9개 모션의 총 304개 시점에서 다리 상단 표본 이탈·어깨 연결 겹침 소실·비정상 좌표 없음. `motion-validation.json` 참조. 표본 검사는 모든 동작의 완전한 무간섭을 보장하지 않는다.
- 발 접지 비교 81개 시점의 최대 높이 차이는 약 0.0144 모델 단위였다. 이후 아랫배만 올린 수정은 발 좌표와 본을 바꾸지 않는다. `feet-validation.json` 참조.
- ⏳ 사용자 최종 외형·플레이 검수.

웹과 실행본 리소스의 브라우저 검사에서 마을·집·잡화점·안내소·증권사 로딩과 걷기·인사·먹기·점프·게걸음을 확인했다. 두 검사 모두 브라우저 오류가 없었다. `browser-web.log`, `browser-runtime.log`와 `game-*.png` 참조.

`original/`은 수정 전 원본이며 `before-belly-shortening/`은 아랫배 단축 전 중간 결과다. `geometry-validation.json`과 `install-validation.json`에 해시와 적용 기록이 있다. 재현 도구는 `build.mjs`, `glb.mjs`, `render.py`, `install.cjs`다.

## 실제 GLB 검수 렌더

게임 모델의 기본 휴지 자세를 Blender로 촬영한 이미지이며 게임 장면 캡처와 구분한다.

[정면](somangi-front.png) · [오른쪽](somangi-right.png) · [후면](somangi-back.png) · [왼쪽](somangi-left.png)

사용자 참고: `reference-front.png`, `reference-side.png`, `reference-rear-detail.png`.
