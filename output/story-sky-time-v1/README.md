# 잠들기 전 대본 하늘 우선

P1 · ✅ 웹·기존 실행본 적용·자동 검증 / ⏳ 사용자 최종 플레이 검수

사용자 요청으로 첫날 전시 하늘이 대본을 따른다. `exhibitionSkyTime.js`에서 flags.sunset/asleep에 따라 낮→노을→취침 밤을 결정한다. Exhibition 생성 시 초기/복원 상태를 즉시 적용하고 render의 기존 노을 전환·취침 암전·엔딩·재시작에도 연결했다. `Scenes.setTime`의 기존 boolean 계약을 유지하면서 옵션을 확장했다.

`TownSky.currentStage`에서 명시적 검사 미리보기 다음으로 scene.userData.storySkyTime을 우선해 기기 시각/수동 시간보다 대본이 앞선다. 일반 마을의 기존 지역 시간 판단·날씨·강수·적설은 바꾸지 않았다. 취침 이후 전시는 기존 엔딩으로 끝나며 다음날/새 시간 체계를 추가하지 않았다. 현재 진행 상태는 기존 SessionStorage 정책을 그대로 따른다.

웹과 기존 실행본에4개 모듈을 동기화했다. 첫날/시간 테스트11개 통과. `scratch/check-story-sky.cjs`를 양쪽에 실행해 기기 시각 한국 새벽3시·자동 밤·수동 밤이어도 첫날 낮, 대본 노을, 취침 밤, 재시작 즉시 낮/다음 갱신 유지·JavaScript 오류 없음 검사를 통과했다. `web-checks.json`·`desktop-checks.json`에 기록했다. 설치 프로그램은 재빌드하지 않았다.
