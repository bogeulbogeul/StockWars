# 소망이 웃는 표정 — 2026-10-19

기본 검은 타원 눈 대신 위로 접힌 곡선 눈, 넓게 올라간 입꼬리를 추가한 별도 표정이다. 걷기 v3의 메시·본·웨이트는 유지하고 Base Color 텍스처의 얼굴 부분만 교체한다. UV 경계에 5픽셀 여유를 채워 기존 눈의 미세한 자국이 비치지 않도록 했다. 원본 걷기·앉기·먹기 및 게임 파일은 변경하지 않았다.

- `happy-front.png`, `happy-face.png`, `happy-angle.png`, `happy-side.png`: 실제 모델의 정면·얼굴 확대·사선·측면 렌더.
- `happy-basecolor.png`: 기존 UV에 맞춘 웃는 표정 전체 Base Color 텍스처.
- `base-original.png`: 교체용 기본 표정 텍스처 복사본.
- `somangi-happy.blend`, `somangi-happy.glb`: 웃는 표정을 입힌 정지 자세 편집본·전달 모델. 새 표정 애니메이션은 포함하지 않는다.

기본/웃음 전환은 동일 UV의 Base Color 이미지 교체로 구성할 수 있다. 런타임 표정 전환 기능이나 게임 설치는 아직 구현하지 않았다. 기본 표정의 자동 교체·최종 채택을 뜻하지 않는다.
