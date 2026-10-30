# 캐릭터 방향 반전 공통 점검·수정

2026-10-30. 안내소 착석 해제와 동일한 quaternion→XYZ Euler 표현 때문에 방향이 뒤집힐 수 있는 캐릭터 회전 경로를 검색했다. 카메라, 문, 가구, 차량, 전달 소품의 회전은 이번 수정 대상에서 제외했다.

수정 범위:
- PlayerSeatDismount는 복원 직후부터 root를 실제 yaw의 (0,yaw,0)으로 설정한다. 렌더 업데이트를 기다리지 않아도 안전하다.
- 공통 의자(집/안내소/실내)와 정류장 착석, 플레이어 즉시 대화/옆걸음 회전.
- 공통 대화 상대 방향과 착석 중 머리 방향 차이 계산. 앉은 몸과 의자 접촉은 유지한다.
- 모아 초기 자세/기상/대화/출입 이동 및 대화 카메라의 방향 읽기.
- 봉봉 첫 인사·작업대 안내·보상 위치 이동과 토리 수업 이동. 부드러운 회전은 quaternion의 실제 방향에서 같은 속도로 시작한다.

공통 helper는 SomangiFacing.js의 setUprightFacing/uprightFacingYaw/turnUprightFacing이며 기존 Somangi 이름도 호환 유지한다. 15개 런타임 파일 목록은 files.json. 경제·대사·동선·모델·애니메이션 키·충돌은 변경하지 않았다.

검증:
- characterFacingAudit.test.mjs의 7개 회귀 테스트: 복원된 PI quaternion에서 공통/NPC/플레이어 대화, 부드러운 NPC 회전, 공통 의자 4방향, 정류장 착석, 애니메이션 기상 완료 시 실제 앞 벡터와 X/Z=0 확인.
- 기존 대화/착석/카메라/옆걸음/봉봉 경로/토리/이야기 진행 테스트 포함 총66개 통과.
- scratch/check-character-facing-audit.cjs 및 --packaged: 집·안내소·은행·잡화점·증권사의 실제 모델을 로드하는 집중 fixture로 각 4방향의 실제 forward 벡터를 확인. 양쪽 20회씩 통과, pageerror 0건. 장면 상태/복원 quaternion을 직접 준비하는 검증이며 전체 게임을 처음부터 끝까지 실제 입력으로 플레이한 검수는 아니다.
- 웹/기존 실행본 리소스 동기화 완료, git diff --check 통과. 실제 Windows EXE 재실행 및 설치 프로그램 재빌드는 하지 않았다.

다른 모든 장면에서 눈에 보이는 반전이 실제 발생했다고 주장하지 않는다. 같은 결함 패턴을 제거하고 공통 경로 회귀를 확인한 범위다. 이전 휴대폰 이후 실제 입력 재촬영은 output/phone-direction-keys-v1/를 참고한다.
