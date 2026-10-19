StockWars 증권사 기본 룸 건물 v1

P0 (Core) · 완료: 평면 구조 제작·GLB 재로딩·현관 관통·바닥 및 벽 노멀 검사.
대기: 사용자 외형 검수·게임 설치·캐릭터 접촉 검수.

Room-clean-colored.glb: 파랑/아이보리 재질. Room-clean-gray.glb: 단색 재질.
Room-clean.blend: 편집 원본. clean-colored-front/rear/left/right.png: 동일 모델을 돌려 렌더링한 실제 시점.
구성: 천장 없는 네 벽, 평평한 타일 바닥, 중앙 현관 구멍, 기둥/몰딩/파란 하단 벽장식.
양쪽 벽은 막힌 상태. 문/엘리베이터/간판/가구/카펫은 별도 추가 대상.
벽은 Wall_Front/Back/Left/Right, 바닥은 Floor, 모서리는 Corner 그룹으로 분리.
GLB Y축 위, Blender Z축 위. 기존 업로드 원본의 단위와 외곽 크기를 참고함.
절대 실측 크기와 게임 배율은 미확정. 메시 46개, 삼각형 5230개.

이미지 AI 변환 없이 Blender 기본 도형/평면으로 제작. 업로드 GLB를 덮어쓰지 않음.
게임 파일과 저장 데이터는 변경하지 않음.
재생성: Blender --background --python build_room.py -- <출력 폴더의 절대 경로>
검증/렌더: Blender --background --python verify_room.py -- <같은 출력 폴더>
