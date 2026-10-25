# 안내소 소파 착석 파묻힘 확인

2026-10-26 사용자 요청으로 현행 forwardOffset=22의 두 자리를 확인했다. 게임 모델/배치는 수정하지 않았다.

`scratch/check-information-sofa-penetration.cjs`를 웹·기존 실행본에 실행해 자리당 실제 표시 스킨 정점136,782개를 월드 좌표로 변형한 뒤 소파 각 메시 경계 안 후보점에서 광선 교차 홀짝법으로 메시 내부 여부를 확인했다. 두 자리 모두 좌판·등받이·팔걸이 등 소파 내부로 분류된 캐릭터 정점은0개였다. 양쪽 측면 확대 렌더를 열어 확인했고 JavaScript 오류는0건이다. 각 자리에서 일어서기도 성공했다.

이 검사는 현재 정지 착석 자세의 정점 포함 검사이며 모든 삼각형 간 교차나 연속 애니메이션 비관통의 수학적 보증은 아니다. 사용자 최종 시각·플레이 검수는 별도다. 캡처를 위한 양면 재질 처리는 검증 브라우저에서만 수행했다.

## 중복 검수 캡처 정리 — 2026-10-26

✅ 삭제 완료. 대조표의 web 캡처와 환경별 검증 기록은 보존했다.

아래 desktop PNG는 동일 폴더 web PNG와 SHA-256까지 일치해 사용자 승인으로 삭제한다. 환경별 JSON 검증 기록과 촬영 스크립트는 별도로 유지한다. 기존 `desktop-*.png` 안내는 아래 대응 web PNG를 따른다. 이 대조표는 기존 촬영 시점의 이미지 내용 일치를 기록하며 새 플레이 검증을 의미하지 않는다.

| 삭제 desktop 캡처 | 보존 web 캡처 | SHA-256 |
|---|---|---|
| `desktop-seat-2-side.png` | [web-seat-2-side.png](web-seat-2-side.png) | `330a323b9a64e3844021390538427b3419491b2e16dae6e58632dbac521f71b2` |
| `desktop-seat-1-side.png` | [web-seat-1-side.png](web-seat-1-side.png) | `e7f3133c0ec0377808b3f31ab8eaa2827230678c56a2fee0be723b4f53e3d886` |
| `desktop-seat-1-back.png` | [web-seat-1-back.png](web-seat-1-back.png) | `a13577482d3b444dfb883a2792039c903076571b93c7d0a23766348ca11ad951` |
| `desktop-seat-2-back.png` | [web-seat-2-back.png](web-seat-2-back.png) | `d532aa0d5d204d4a74880a3b8f25edb3ea8ee4d382277bfad419033d7bd15f1e` |
