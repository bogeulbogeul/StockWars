# 소망이 게임 재적용

사용자 요청: “소망이 게임에 적용해줘.” 2026-10-23 삭제 중 소망이만 복원한다.

**P1 (Major) · ✅ 웹·기존 로컬 실행본 캐릭터 반영·게임 브라우저 검사 / ⏳ 사용자 최종 외형·플레이 검수.**

## 기준과 적용

- 외형·먹기: [뒤 연결부 v43](../output/somangi-rear-junction-v43/README.md). 팔꿈치 본 없이 팔 전체를 회전한다.
- 표정: [표정 v6](../output/somangi-story-expressions-v6/README.md)의 14종. 시무룩·뿌듯함은 제외한다. 기본 U 미소, 굵은 웃는 눈, v6 눈 크기를 유지한다.
- 걷기: `output/somangi-game-v1/somangi-walk.blend`. 원본 정점 좌표를 바꾸지 않고 두 다리 본을 추가했다. 0.75초 반복이며 팔은 기존 통팔 본을 사용한다.
- 게임 배포 폴더: `web/assets/characters/3d/somangi/`. 걷기·먹기 2개 GLB와 14종 얼굴 PNG/잉크 반사 마스크, 해시 매니페스트를 설치한다.
- 얼굴은 공유 UV 텍스처를 교체하며 캐릭터 14개를 겹쳐 로딩하지 않는다. 검은 잉크 부분의 반사를 차단한다. 실내마다 본·재질은 독립 복제하고 원본 모델·텍스처 다운로드는 공유한다.
- 마을·집·잡화점·안내소·은행·증권사에서 같은 소망이를 사용한다. 일반 모드는 이동 시 걷기, 멈추면 기본 자세, `2`로 먹기를 재생하고 종료 후 기본 자세로 돌아간다.
- 첫날 전시는 도착 이동에 걷기를 연결하고 대사·활동에 표정을 지정한다. 실내에서 대사창에 가리지 않는 위치를 사용한다. 전시 대화 중 수동 먹기 입력은 차단한다.
- 모아·토리·봉봉, 앉기·점프·인사·게걸음 모델은 복원하지 않는다. 기존 대사·기능·저장과 제작 원본은 보존한다.

## 검증

- [걷기 검사](../output/somangi-game-v1/walk-verification.json): 31시점, 원본 정점 좌표 동일. 통팔 표본 길이 최대 오차 0.00000009 원본 단위. 발 최저점 변화 0.00000018 원본 단위 이내.
- `scratch/check-somangi-game.cjs`: 실제 마을 걷기·먹기 종료, 표정 14종·삭제 표정 거부·빠른 전환 순서, 실내 5곳, 독립 본·재질, 에셋 누락·실행 오류 없음.
- `scratch/check-somangi-standard.cjs`: 웹과 기존 로컬 실행본 리소스 각각 검사. 일반 마을과 실내 4곳에서 실제 `2`키 먹기, 숨겨진 마을 캐릭터의 동시 입력 차단, 실행 오류·에셋 누락 없음.
- `scratch/check-exhibition.cjs`: 포장 선행 318장면·투자 선행 313장면 완주, 저장 재개·대출 중복 방지·모바일 초기화 통과.
- `web/tests/exhibition.test.mjs`: 6개 통과.
- 실제 게임 화면: [마을](../scratch/somangi-game-town.png), [걷기](../scratch/somangi-game-walk.png), [먹기](../scratch/somangi-game-eat.png), [집](../scratch/somangi-game-home.png), [잡화점](../scratch/somangi-game-store.png).

로컬 실행본은 기존 `electron-app/dist/win-unpacked/resources/web/`의 캐릭터 관련 모듈·에셋을 갱신했다. 검사 중 기존 실행본이 참조하지만 누락돼 있던 `DemoLifecycle.js`, `demo-end.html`, `demo-end.css`, `diary.css`, `exhibition.css`도 현재 웹 파일로 보완했다. 기존 실행본 일반 모드에서 검사했으며 전시 배포판 전체 업데이트나 설치 프로그램 재빌드를 뜻하지 않는다.
