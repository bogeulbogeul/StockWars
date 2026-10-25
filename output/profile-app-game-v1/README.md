# 내 정보·서류·실제 분석력 게임 적용 v1

사용자 확정 profile-app-design-v2를 현행 스마트폰 내 정보 앱에 연결했다. 로즈 프로필·하늘색 분석력·서류 정보 요약·서류함·필터·서류 상세를 제공하며 상단 홈/P 토글/launcher 숨김을 유지한다.

## 서류 기록

- 입주 서류는 실제 receiveResidencePaper 전달 완료 직후, 계좌/대출 서류는 기존 원본 신청서 제시 시 수령 기록을 남긴다.
- 기존 원본 서류 제출이 완료되고 State.complete가 성공할 때만 서명 스냅샷(이름·대출 신청 금액·시각)을 기록한다. 수령만으로 nickname/bank/loan flag나 돈을 바꾸지 않는다.
- 기존 story state 안 profileDocuments에 저장하며 원래 전시 SessionStorage 정책을 유지한다(실행 종료/재시작 시 전시 진행 초기화). 서류 수령 저장 실패 시 기록을 롤백하고 재시도 버튼을 제공한다. 기존 제출 실패 시 controller의 이전 상태 복원을 유지한다.
- 이전 저장의 nickname/bank/loan 완료 flag가 있는 서류는 완료된 것으로 조회하지만 누락된 수령/서명 날짜를 만들어내지 않는다. 은행/대출 정보는 서명 완료 후에만 확정 표시한다. 상세는 보관된 신청 내용 요약이며 원본의 전체 조항을 대체하지 않는다.
- 일반 모드에서 실제 서류 기록이 없는 경우 빈 서류함을 표시한다. 첫날 기록을 일반 계좌로 복사하거나 가짜 계좌 번호/주소를 만들지 않는다.

## 실제 분석력

일반 모드는 ItemEngine.analysisProgress()의 실제 저장 단계·숙련도·요구량을 직접 조회하고500ms 간격으로 갱신한다. 최고단계5는 완료 문구로 표시하며0으로 나누는 진행도를 만들지 않는다. 산식·퀴즈 보상·성장 저장은 변경하지 않았다.

첫날 전시는 기존 state.analysis의 실제 투자 시험 결과 단계(현재 초기1, 전 문항 정답2)를 표시한다. 이 별도 체험은 숙련도 저장이 없으므로4/40 같은 수치를 꾸미지 않고 별도 안내한다. 일반 저장과 혼합하지 않는다.

## 적용 및 검증

synced-files.txt의11개 파일을 웹/기존 실행본 resources/web에 SHA256 일치로 반영했다. 설치 프로그램 재빌드·서버 배포는 하지 않았다.

node --test web/tests/phoneProfile.test.mjs web/tests/exhibition.test.mjs web/tests/analysisFiveLevels.test.mjs:17개 통과. 서류 수령/미서명/제출 구분·저장 복원·기존 서명 조회·실패 롤백·중복 대출 없음·실제 분석력/최고단계·전시/성장 회귀 검증.

scratch/check-phone-profile.cjs: 웹과 resources/web에서 실제 ItemEngine 상태를 읽는 분석력/숙련도 갱신·최고단계, 실제 ExhibitionActivities.bank/loan과 원본 BankApplication 제출 버튼을 통한 수령→서명→프로필 변경, 미서명 대출 금액 확정 금지, 서류 목록/필터/상세·모바일·홈 복귀·빠른 닫기/재열기·오류0건을 확인했다. 서류 양식은 격리 테스트 컨트롤러를 통해 실제 State.complete/save에 연결했고 전체 스토리를 처음부터 끝까지 재플레이한 것은 아니다. 테스트 이름/분석력 값은 격리 브라우저 값이며 사용자의 기존 저장을 수정하지 않았다. 사용자 최종 시각/전체 플레이 검수는 별도다.

빠른 닫기/재열기 때 이전 dialog close 이벤트가 새 앱 cleanup을 실행하던 공통 PhoneHome 문제를 수정했다. 닫기 시 동기 정리하고 이미 다시 열린 dialog에는 이전 close 정리를 적용하지 않는다.
