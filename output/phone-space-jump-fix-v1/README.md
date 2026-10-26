# Space가 스마트폰을 열던 문제 수정

사용자 재현: 스마트폰 버튼을 클릭한 후 닫으면 버튼에 포커스가 복원돼 Space가 네이티브 버튼 클릭으로 처리되고 점프 대신 스마트폰을 다시 열었다.

- 스마트폰 종료 시 launcher에 포커스를 다시 남기지 않는다.
- launcher의 Space keyup 네이티브 클릭을 막는다. 클릭·Enter·P 열기는 유지한다.
- 일반/실내 SomangiControls와 전시 JumpInput/Arrival은 launcher 포커스를 점프 입력으로 허용한다. 입력창·다른 버튼·모달·착석·자동 이동·머리 위 충돌 등 기존 금지는 유지한다.
- 점프가 금지된 상황에서도 Space가 스마트폰을 여는 대체 동작으로 흘러가지 않는다. 저장된 키 설정은 변경하지 않았다.

synced-files.txt의5개 런타임 파일을 웹/기존 실행본 resources/web에 동일 해시로 반영했다. 설치 프로그램은 재빌드하지 않았다.

node --test web/tests/somangiJump.test.mjs web/tests/keyBindings.test.mjs:6개 통과.

scratch/check-phone-space-jump.cjs: 실제 전시 launcher focus→Space 점프/스마트폰 안 열림, Enter 열기→P 닫기→Space 점프, P 토글, 도착 단계 Space, 일반 SomangiControls에서 launcher focus의 정상/차단 점프와 네이티브 클릭 없음, 입력창/대화 진행/착석/자동이동/머리 위 충돌 금지, 집/잡화점/안내소/은행/증권사5개 실내 Space 점프를 웹과 기존 실행본에서 확인했다. 페이지 오류0건. 실내는 격리 테스트에서 prepareRoom/show로 준비했으며 게임 도보 출입 기능은 변경하지 않았다. 최초 오래된 테스트의 scene.show 도보 대기는 테스트만 종료하고 이 격리 준비 방식으로 수정했다. 사용자 최종 전체 플레이 검수는 별도다.
