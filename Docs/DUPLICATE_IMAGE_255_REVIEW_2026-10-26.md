# 보류 중복 이미지 255개 재검토 — 2026-10-26

✅ 검토 및 후속 승인 삭제 완료. 사용자 승인으로 중복 검수 캡처 33개만 삭제했고 동일한 web 캡처·현재 원본·게임 파일과 환경별 검증 기록은 유지했다.

- 검토 255개 / 삭제 완료 33개·9,279,781바이트 / 유지 222개.
- 후보는 같은 검수 폴더의 desktop 캡처와 web 캡처가 SHA-256까지 일치하는 경우다. web 캡처를 보존하고 환경별 JSON 검증 기록과 촬영 스크립트도 유지한다.
- 검수 폴더 8곳의 README에 desktop → web 파일명·SHA-256 대조표를 남겼다. 환경별 JSON 기록과 촬영 스크립트는 보존했다.
- 동일 web 캡처·웹/실행본·`.blend` 원본·검증 JSON·나머지 캡처·촬영 스크립트를 합해 보호 파일 3,395개의 SHA-256이 삭제 전후 동일했다. 삭제 경로와 검증 결과는 `scratch/capture-33-deletion-2026-10-26.json`에 있다.
- 파일명 직접 참조 검색과 생산 스크립트 검토를 수행했다. 동적으로 조합되는 모든 소비 경로의 부재를 완전히 증명하는 검사는 아니다.

## 삭제 완료 목록

| 삭제 후보 | 동일한 보존본 | 바이트 |
|---|---|---:|
| `output/exterior-wall-rigidbody-v1/desktop-store.png` | `output/exterior-wall-rigidbody-v1/web-store.png` | 147,521 |
| `output/indoor-furniture-rigidbody-v1/desktop-store.png` | `output/indoor-furniture-rigidbody-v1/web-store.png` | 147,521 |
| `output/indoor-wall-rigidbody-v1/desktop-store.png` | `output/indoor-wall-rigidbody-v1/web-store.png` | 147,521 |
| `output/exterior-wall-rigidbody-v1/desktop-bank.png` | `output/exterior-wall-rigidbody-v1/web-bank.png` | 359,351 |
| `output/indoor-wall-rigidbody-v1/desktop-bank.png` | `output/indoor-wall-rigidbody-v1/web-bank.png` | 359,351 |
| `output/exterior-wall-rigidbody-v1/desktop-information.png` | `output/exterior-wall-rigidbody-v1/web-information.png` | 352,825 |
| `output/indoor-wall-rigidbody-v1/desktop-information.png` | `output/indoor-wall-rigidbody-v1/web-information.png` | 352,825 |
| `output/information-sofa-seat-penetration-check-v1/desktop-seat-2-side.png` | `output/information-sofa-seat-penetration-check-v1/web-seat-2-side.png` | 968,888 |
| `output/information-sofa-seat-penetration-check-v1/desktop-seat-1-side.png` | `output/information-sofa-seat-penetration-check-v1/web-seat-1-side.png` | 945,730 |
| `output/exterior-wall-rigidbody-v1/desktop-stock.png` | `output/exterior-wall-rigidbody-v1/web-stock.png` | 313,753 |
| `output/indoor-wall-rigidbody-v1/desktop-stock.png` | `output/indoor-wall-rigidbody-v1/web-stock.png` | 313,753 |
| `output/information-sofa-seat-penetration-check-v1/desktop-seat-1-back.png` | `output/information-sofa-seat-penetration-check-v1/web-seat-1-back.png` | 637,852 |
| `output/exterior-wall-rigidbody-v1/desktop-training.png` | `output/exterior-wall-rigidbody-v1/web-training.png` | 277,473 |
| `output/information-sofa-seat-penetration-check-v1/desktop-seat-2-back.png` | `output/information-sofa-seat-penetration-check-v1/web-seat-2-back.png` | 549,943 |
| `output/exterior-wall-rigidbody-v1/desktop-home.png` | `output/exterior-wall-rigidbody-v1/web-home.png` | 142,189 |
| `output/indoor-wall-rigidbody-v1/desktop-home.png` | `output/indoor-wall-rigidbody-v1/web-home.png` | 142,189 |
| `output/jump-check-v1/desktop-jump-bank.png` | `output/jump-check-v1/web-jump-bank.png` | 361,472 |
| `output/indoor-furniture-rigidbody-v1/desktop-bank.png` | `output/indoor-furniture-rigidbody-v1/web-bank.png` | 360,804 |
| `output/indoor-furniture-rigidbody-v1/desktop-information.png` | `output/indoor-furniture-rigidbody-v1/web-information.png` | 352,075 |
| `output/jump-check-v1/desktop-jump-information.png` | `output/jump-check-v1/web-jump-information.png` | 350,881 |
| `output/jump-check-v1/desktop-jump-stock.png` | `output/jump-check-v1/web-jump-stock.png` | 316,274 |
| `output/indoor-furniture-rigidbody-v1/desktop-stock.png` | `output/indoor-furniture-rigidbody-v1/web-stock.png` | 315,489 |
| `output/indoor-furniture-rigidbody-v1/desktop-training.png` | `output/indoor-furniture-rigidbody-v1/web-training.png` | 279,372 |
| `output/jump-check-v1/desktop-jump-store.png` | `output/jump-check-v1/web-jump-store.png` | 147,204 |
| `output/indoor-furniture-rigidbody-v1/desktop-home.png` | `output/indoor-furniture-rigidbody-v1/web-home.png` | 143,430 |
| `output/jump-check-v1/desktop-jump-home.png` | `output/jump-check-v1/web-jump-home.png` | 142,228 |
| `output/rumor-quiz-stamp-2026-10-25/desktop-wrong.png` | `output/rumor-quiz-stamp-2026-10-25/web-wrong.png` | 63,263 |
| `output/rumor-quiz-stamp-2026-10-25/desktop-quiz-open.png` | `output/rumor-quiz-stamp-2026-10-25/web-quiz-open.png` | 59,021 |
| `output/rumor-quiz-stamp-2026-10-25/desktop-correct-stamp.png` | `output/rumor-quiz-stamp-2026-10-25/web-correct-stamp.png` | 77,646 |
| `output/rumor-olive-ui-2026-10-25/desktop-wrong.png` | `output/rumor-olive-ui-2026-10-25/web-wrong.png` | 68,718 |
| `output/rumor-letter-ui-2026-10-25/desktop-wrong.png` | `output/rumor-letter-ui-2026-10-25/web-wrong.png` | 65,433 |
| `output/jump-check-v1/desktop-jump-training.png` | `output/jump-check-v1/web-jump-training.png` | 9,822 |
| `output/jump-check-v1/desktop-jump-simulation.png` | `output/jump-check-v1/web-jump-simulation.png` | 7,964 |

## 유지 분류

| 이유 | 파일 수 |
|---|---:|
| Character input/base or QA contact sheet retained with each version | 25 |
| Concept/adopted art, source motion edit, or distinct historical comparison; preserve source path | 22 |
| Retain web canonical capture, non-identical pair, or distinct test-stage evidence | 38 |
| Comparison page dynamically builds material-v1 filenames | 5 |
| Numbered motion/inspection sequence; glob/index-based packaging requires path and frame count | 132 |

모든 255개 경로의 판정·해시·근거는 `scratch/duplicate-255-review-2026-10-26.json`에 기록했다. 게임 변경이 없어 플레이 테스트는 수행하지 않았다.
