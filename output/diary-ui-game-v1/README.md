# 다이어리 쓰기 UI 게임 적용

2026-10-26 · P1 (Major) · ✅ 웹·기존 실행본 리소스 반영·브라우저 검증 / ⏳ 사용자 최종 플레이·디자인 검수. 설치 프로그램은 재빌드하지 않았다.

배경 없는 세이지색 펼친 책 UI를 적용했다. 책 이미지 바깥은 실제 알파 투명이며 방/배경 이미지를 포함하지 않는다. 게임 월드는 뒤에 그대로 보인다. 글자·버튼은 이미지에 굽지 않고 DOM으로 표시하며 작은 화면은 종이 페이지를 세로로 배치한다.

## 사용과 이야기 연결

- 다이어리를 받은 뒤 **J**로 열고 다시 J 또는 Esc/닫기로 닫는다. 키보드 입력칸·다른 모달·타이틀·전달/도보 안내 중에는 새로 열지 않는다. 기존 재배정된 다른 행동 키는 `gameKey` 규칙을 우선하며 J를 다른 행동에 배정했다면 그 행동과 겹쳐 실행하지 않는다.
- 첫날 씨앗 심기 다음 `diaryWritten`에서 다이어리를 연다. ‘오늘의 기록 남기기’로 정해진 첫날 문장이 한 글자씩 채워지고 펜 표시가 따라간다. 자유 입력/새 작성 데이터는 추가하지 않았다.
- 쓰기 도중 닫으면 첫 기록 완료로 처리하지 않는다. 전부 작성한 뒤 덮을 때만 기존 `next('diaryWritten')`을 호출한다. 작성 완료 뒤 재열람은 기존 플래그로 판단하며 돈/보상을 재지급하지 않는다.
- 일반 모드의 기존 저장하기·저장하고 종료하기는 DiaryModal에서 기존 `saveDiary`를 계속 사용한다. 전시와 일반 저장을 혼합하지 않는다.

## 파일과 검증

`web/js/components/DiaryBook.js`: 책 화면·문자 표시·작성 완료/취소.
`web/js/app/InstallDiary.js`: 수령 여부와 J 단축키·이동 입력 차단.
`web/js/components/DiaryModal.js`: 일반 저장/종료 호환.
`web/css/modules/diary.css`, `web/assets/ui/diary-v1/book.png`: 반응형 스타일·투명 책 스킨.
전시 Activities/Exhibition과 일반 InstallPhoneHome에 연결했다. CSS 캐시 버전을 갱신했다.

`scratch/check-diary-ui.cjs`로 실제 앱에서 작성 취소/완료·J 토글·수령 전 차단·작성 후 재열람·스마트폰 입력 차단·1280×900/390×844/844×390 표시를 웹과 실행본 각각 확인했다. 브라우저 예외 0건. 결과는 `validation-web.json`·`validation-runtime.json`, 화면은 `writing.png`·`complete.png`·크기별 PNG다.

`diarySave.test.mjs`·`exhibition.test.mjs`·`keyBindings.test.mjs` 총 20개 통과. 기존 실행본에 빠진 저장/전시 의존 모듈도 포함해 모듈 로딩을 확인했다. 검증 스킵으로 첫 기록 위치를 설정한 검사는 실제 첫날 전체 재플레이와 구분한다.

## 책 이미지 제작

기본 image_gen 도구로 채택 시안에서 글자·버튼·펜을 제거한 빈 투명 책 스킨을 제작했다. 최종 프롬프트는 ‘open sage green book silhouette, ivory paper, beige central ribbon, thin paper edges and faint horizontal writing lines; remove all text, headings, handwriting, numbers, buttons and pen; alpha transparent outside; no room or colored backdrop’이다. PNG 모서리 alpha=0 확인. 최종 게임 참조 이미지는 위 `web/assets/ui/diary-v1/book.png`에 저장했다.
