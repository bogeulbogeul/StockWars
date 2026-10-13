# 전체 방향 색·명암·선 통일

사용자 요청으로 두 캐릭터의9상태를 정면 정지 기준으로 비교했다. 강아지 옆 걷기의 옅은 베이지, 고양이 정면 걷기의 푸른 회색과 옆·뒤의 따뜻한 갈색 기운을 확인했다. 정면 정지는 기준으로 유지하고 나머지8행씩 총16행을 내장 image_gen으로 색과 표현을 보정했다. 손가락, 팔 스윙,3자세 걷기,4자세 운반과 앉기 유지 구성은 보존하도록 지정했다. 각 run/prompts/*-uniform-style.txt에 프롬프트를 보존하고 기존행은 style-before에 저장했다.

고양이4행은 정면 차콜 색값을 지정해 추가 보정했다. 이미지 생성만으로 남는 따뜻한 색차는 sprite-gen recolor의 색상 맵으로 정리한다. RGB만 바꾸며 투명도와 좌표는 그대로 유지하는 기존 엔진 단계다. 팔레트 초안의 일부 색만 매핑한 결과는 얼룩이 생길 수 있어 채택하지 않는다. 최종 출력은 variants-full/charcoal-unified.png와 해당 recolor.report.json을 사용한다. make_charcoal_spec.py는 입력 색상을 읽어 맵 JSON만 작성하며 이미지 픽셀을 직접 수정하지 않는다.

최종 고양이 보정은 밝기 단계의 강제 양자화 대신 원래 밝기를 유지한 쿨 차콜 색상 맵을 사용한다. palette-frames의18개 프레임별 recolor 보고서와 verification.json이 최종 검증 기록이다. bake_charcoal_frames.py는 동일한 기존 recolor.bake 엔진을 프레임별 호출하며, 보정 전후 알파가 바이트 단위로 동일함을 확인했다. variants와 variants-full의 중간 팔레트 시안은 최종 채택본이 아니다. 최종 시트는 run/sprite-sheet-alpha.png다.

canonical extract와 compose-atlas를 사용했다. 색상 통일과 프레임 파일 검사는 모션의 발 교대·접지·게임 이동 연동의 최종 합격을 뜻하지 않는다. 게임 플레이어 에셋은 교체하지 않았다.
