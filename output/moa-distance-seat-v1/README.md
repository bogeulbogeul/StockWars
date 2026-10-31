# 원거리 모아 벤치 부유 표시 수정

원인: TownModelScene은 지형/벤치와 플레이어에 TownLandscape의 원경 굽힘 셰이더를 적용했지만, 나중에 추가한 sleepingAnna(광장에서도 재사용하는 모아)에는 적용하지 않았다. 멀리서 벤치만 아래로 굽혀져 모아가 떠 보였다. 실제 착석 좌표나 의자 접촉 문제가 아니므로 좌표/벤치/캐릭터 포즈는 변경하지 않았다.

TownModelScene에서 로드 완료된 모아 root도 같은 landscape.wrap으로 감싼다. MoaFadeOut의 임시 복제 재질은 원본 onBeforeCompile/customProgramCacheKey도 보존해 페이드 중 효과가 빠지지 않게 한다.

검증: scratch/check-moa-distance-seat.cjs는 실제 TownModelScene과 광장 착석 함수를 사용하는 집중 fixture다. awake/광장 착석과 관찰자 위치를 직접 준비한다. 웹 및 기존 실행본 리소스에서 모아/벤치 모두 같은 villageCenterZ uniform 및 굽힘 코드가 적용됨을 확인하고, 가까이→멀리→다시 가까이에서 착석 좌표 동일·오류0을 확인했다. 실제 1920×1080 스크린샷의 원경에서도 벤치 좌판과 모아가 함께 내려간다. 처음부터 은행 이후 전체 플레이를 한 검증은 아니다. checks.json 및 near/far/near-again 이미지 참고.

관련 렌더링/페이드/이야기 Node테스트14개 통과. 페이드 테스트는 임시 재질의 셰이더 콜백/캐시 키 보존도 확인한다. 웹/기존 실행본2개 JS 동기화. 실제 EXE 및 설치 프로그램 재빌드는 하지 않았다.
